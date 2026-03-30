package com.fairsplit.app;

import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;
import com.getcapacitor.JSObject;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class TransactionNotificationService extends NotificationListenerService {
    private static final String TAG = "FairSplitNotifService";

    // Only listen to UPI payment apps — not every app on your phone
    private static final String PHONEPE = "com.phonepe.app";
    private static final String GPAY    = "com.google.android.apps.nbu.paisa.user";
    private static final String PAYTM   = "net.one97.paytm";

    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
        "(?:rs\\.?|inr|₹)\\s*([\\d,]+(?:\\.\\d{1,2})?)", Pattern.CASE_INSENSITIVE
    );

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        String pkg = sbn.getPackageName();
        if (!isUpiPackage(pkg)) return;

        Bundle extras = sbn.getNotification().extras;
        String title  = extras.getString("android.title", "");
        String text   = extras.getCharSequence("android.text", "").toString();
        String full   = title + " " + text;

        Log.d(TAG, "Notification from " + pkg + ": " + full);

        // ─── GOLDEN GATE: Only process structurally valid bank messages ───
        if (!StructureValidator.isValid(full)) {
            Log.d(TAG, "Notification failed Golden Gate check — spam ignored: " + title);
            return;
        }

        Double amount = parseAmount(full);
        if (amount == null) return;

        String type     = parseType(full);
        String merchant = parseMerchant(full);
        String finalMerchant = (merchant != null && !merchant.isEmpty()) ? merchant : title;
        String date     = parseDate(full);

        // ─── HOLDING TANK: Wait 30 seconds, defer to SMS if it arrives ───
        TransactionBuffer.getInstance().evaluate(
            this, amount, finalMerchant, full, "notification", type, date,
            data -> emitTransactionToWeb(data)
        );
    }

    private boolean isUpiPackage(String pkg) {
        return PHONEPE.equals(pkg) || GPAY.equals(pkg) || PAYTM.equals(pkg);
    }

    // ─────────────────────────────────────────────────────────────────
    // Parsers (mirrored from SmsReceiver)
    // ─────────────────────────────────────────────────────────────────

    private Double parseAmount(String text) {
        Matcher m = AMOUNT_PATTERN.matcher(text);
        if (m.find()) {
            try {
                return Double.parseDouble(m.group(1).replace(",", ""));
            } catch (Exception e) {
                Log.e(TAG, "Error parsing amount", e);
            }
        }
        return null;
    }

    private String parseType(String text) {
        if (text == null) return "debit";
        String lower = text.toLowerCase();
        if (lower.contains("credited") || lower.contains("received") ||
            lower.contains("added")    || lower.contains("deposited") ||
            lower.contains("refund")   || lower.contains("to you")    ||
            lower.contains("to your account") ||
            lower.contains("sent to your bank account") ||
            lower.contains("upi/cr")) {
            return "credit";
        }
        return "debit";
    }

    private String parseMerchant(String text) {
        // 1. Deep UPI routing string: UPI/DR/Ref/Name or UPI/CR/Ref/Name
        Matcher m1 = Pattern.compile("(?i)UPI/[^/\\s]+/[^/\\s]+/([^/\\s\n]+)").matcher(text);
        if (m1.find()) return m1.group(1).trim();

        // 2. "debited/paid ... towards [Name] for/value/on"
        Matcher m2 = Pattern.compile("(?i)(?:debited|paid).*?towards\\s+(.*?)\\s+(?:for|value|on|at|ref)").matcher(text);
        if (m2.find()) return m2.group(1).trim();

        // 3. "paid/sent to [Name] for/on/via"
        Matcher m3 = Pattern.compile("(?i)(?:paid|sent)\\s+to\\s+(.*?)\\s+(?:for|on|via)").matcher(text);
        if (m3.find()) return m3.group(1).trim();

        // 4. "[Name] has sent ₹Amount to your account" — GPay notification style
        Matcher m4 = Pattern.compile("(?i)^(.+?)\\s+has\\s+sent\\s+(?:inr|rs\\.?|₹)").matcher(text);
        if (m4.find()) return m4.group(1).trim();

        // 5. Axis Bank multiline: merchant on the line after the date
        Matcher m5 = Pattern.compile("(?i)\\d{2}-\\d{2}-\\d{2,4}(?:\\s+\\d{2}:\\d{2}:\\d{2})?(?:\\s+IST)?\\s*\\n([^\\n]+)").matcher(text);
        if (m5.find()) {
            String candidate = m5.group(1).trim();
            String cl = candidate.toLowerCase();
            if (!cl.contains("avl lmt") && !cl.contains("limit") && !cl.contains("clear bal")) {
                return candidate;
            }
        }
        return null;
    }

    private String parseDate(String text) {
        Matcher m1 = Pattern.compile("(?i)\\d{2}-\\d{2}-\\d{2,4}\\s+\\d{2}:\\d{2}:\\d{2}(?:\\s+IST)?").matcher(text);
        if (m1.find()) return m1.group(0).trim();
        Matcher m2 = Pattern.compile("(?i)\\d{2}-\\d{2}-\\d{2,4}").matcher(text);
        if (m2.find()) return m2.group(0).trim();
        Matcher m3 = Pattern.compile("(?i)\\d{2}-[a-z]{3}-\\d{2,4}").matcher(text);
        if (m3.find()) return m3.group(0).trim();
        return null;
    }

    // ─────────────────────────────────────────────────────────────────
    // Emit to Firestore + JS Bridge
    // ─────────────────────────────────────────────────────────────────

    private void emitTransactionToWeb(TransactionBuffer.SlotData data) {
        Log.i(TAG, "Emitting notification transaction: ₹" + data.amount + " at " + data.merchant + " [" + data.type + "]");

        com.google.firebase.auth.FirebaseUser user =
            com.google.firebase.auth.FirebaseAuth.getInstance().getCurrentUser();
        if (user != null) {
            java.util.Map<String, Object> doc = new java.util.HashMap<>();
            doc.put("amount",   data.amount);
            doc.put("merchant", data.merchant != null ? data.merchant : "Unknown");
            doc.put("rawText",  data.rawText);
            doc.put("source",   data.source);
            doc.put("type",     data.type);
            doc.put("status",   "pending");
            if (data.originalDate != null) doc.put("originalDate", data.originalDate);
            doc.put("timestamp", com.google.firebase.firestore.FieldValue.serverTimestamp());

            com.google.firebase.firestore.FirebaseFirestore.getInstance()
                .collection("pending_transactions")
                .document(user.getUid())
                .collection("items")
                .add(doc)
                .addOnSuccessListener(ref -> Log.d(TAG, "Saved: " + ref.getId()))
                .addOnFailureListener(e  -> Log.e(TAG, "Firestore error", e));
        }

        if (MainActivity.getBridgeInstance() != null) {
            JSObject js = new JSObject();
            js.put("amount",   data.amount);
            js.put("merchant", data.merchant);
            js.put("rawText",  data.rawText);
            js.put("source",   data.source);
            js.put("type",     data.type);
            if (data.originalDate != null) js.put("originalDate", data.originalDate);
            MainActivity.getBridgeInstance().triggerWindowJSEvent("nativeTransaction", js.toString());
        }
    }
}
