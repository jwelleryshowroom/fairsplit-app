package com.fairsplit.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;
import com.getcapacitor.JSObject;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "FairSplitSms";
    private static final Pattern AMOUNT_PATTERN = Pattern.compile(
        "(?:rs\\.?|inr|₹)\\s*([\\d,]+(?:\\.\\d{1,2})?)", Pattern.CASE_INSENSITIVE
    );

    @Override
    public void onReceive(Context context, Intent intent) {
        if (!"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) return;

        Bundle bundle = intent.getExtras();
        if (bundle == null) return;

        Object[] pdus = (Object[]) bundle.get("pdus");
        if (pdus == null) return;

        for (Object pdu : pdus) {
            try {
                SmsMessage smsMessage = SmsMessage.createFromPdu((byte[]) pdu);
                String sender = smsMessage.getDisplayOriginatingAddress();
                String body   = smsMessage.getMessageBody();

                Log.d(TAG, "SMS from: " + sender + " | Body: " + body);

                // ─── GOLDEN GATE: Only process structurally valid bank messages ───
                if (!StructureValidator.isValid(body)) {
                    Log.d(TAG, "SMS failed Golden Gate check — ignored.");
                    continue;
                }

                Double amount = parseAmount(body);
                if (amount == null) continue;

                String type     = parseType(body);
                String merchant = parseMerchant(body);
                String finalMerchant = (merchant != null && !merchant.isEmpty()) ? merchant : sender;
                String date     = parseDate(body);

                // ─── HOLDING TANK: Wait 30 seconds, prefer SMS over notification ───
                TransactionBuffer.getInstance().evaluate(
                    context, amount, finalMerchant, body, "sms", type, date,
                    data -> emitTransactionToWeb(data)
                );

            } catch (Exception e) {
                Log.e(TAG, "Error parsing SMS", e);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────
    // Parsers
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
        // HH:MM:SS with optional IST
        Matcher m1 = Pattern.compile("(?i)\\d{2}-\\d{2}-\\d{2,4}\\s+\\d{2}:\\d{2}:\\d{2}(?:\\s+IST)?").matcher(text);
        if (m1.find()) return m1.group(0).trim();
        // Numeric date DD-MM-YY or DD-MM-YYYY
        Matcher m2 = Pattern.compile("(?i)\\d{2}-\\d{2}-\\d{2,4}").matcher(text);
        if (m2.find()) return m2.group(0).trim();
        // Alphabetic month: DD-MMM-YYYY (e.g. 25-MAR-2026)
        Matcher m3 = Pattern.compile("(?i)\\d{2}-[a-z]{3}-\\d{2,4}").matcher(text);
        if (m3.find()) return m3.group(0).trim();
        return null;
    }

    // ─────────────────────────────────────────────────────────────────
    // Emit to Firestore + JS Bridge
    // ─────────────────────────────────────────────────────────────────

    private void emitTransactionToWeb(TransactionBuffer.SlotData data) {
        Log.i(TAG, "Emitting SMS transaction: ₹" + data.amount + " at " + data.merchant + " [" + data.type + "]");

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
