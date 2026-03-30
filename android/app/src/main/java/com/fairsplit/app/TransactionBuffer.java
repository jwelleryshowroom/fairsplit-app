package com.fairsplit.app;

import android.content.Context;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import java.util.HashMap;
import java.util.Map;

/**
 * 30-Second Holding Tank for incoming transactions.
 *
 * Logic:
 *  - When a notification or SMS arrives, it enters a "slot" keyed by (amount + 30s time-bucket).
 *  - If a second event for the same amount arrives within 30 seconds, SMS data wins.
 *  - If 30 seconds pass with no second event, the lone event is flushed to Firestore.
 *
 * This eliminates duplicates AND ensures the highest quality data (SMS over notification).
 */
public class TransactionBuffer {

    private static final String TAG = "TransactionBuffer";
    private static final long HOLD_DURATION_MS = 30_000; // 30 seconds
    private static final long BUCKET_SIZE_MS    = 30_000; // Same as hold duration

    // Singleton
    private static TransactionBuffer instance;
    public static synchronized TransactionBuffer getInstance() {
        if (instance == null) instance = new TransactionBuffer();
        return instance;
    }

    private final Handler handler = new Handler(Looper.getMainLooper());

    // Slot: key → pending transaction data
    private final Map<String, SlotData> slots = new HashMap<>();

    // ─────────────────────────────────
    // Inner data class for each slot
    // ─────────────────────────────────
    static class SlotData {
        double amount;
        String merchant;
        String rawText;
        String source;  // "sms" or "notification"
        String type;
        String originalDate;

        SlotData(double amount, String merchant, String rawText,
                 String source, String type, String originalDate) {
            this.amount      = amount;
            this.merchant    = merchant;
            this.rawText     = rawText;
            this.source      = source;
            this.type        = type;
            this.originalDate = originalDate;
        }
    }

    // ─────────────────────────────────
    // Generate slot key
    // ─────────────────────────────────
    private String makeKey(double amount) {
        // Bucket = 30-second window — two events for ₹500 in different buckets get different keys
        long bucket = System.currentTimeMillis() / BUCKET_SIZE_MS;
        return (int) amount + "_" + bucket;
    }

    // ─────────────────────────────────
    // Main entry point
    // ─────────────────────────────────
    public void evaluate(Context context, double amount, String merchant, String rawText,
                         String source, String type, String originalDate,
                         FlushCallback callback) {

        String key = makeKey(amount);

        synchronized (slots) {
            if (slots.containsKey(key)) {
                // Slot already exists — a second source has arrived for the same transaction
                SlotData existing = slots.get(key);
                Log.d(TAG, "Match found for key=" + key + " existing=" + existing.source + " new=" + source);

                // SMS always wins — prefer it over notification
                if ("sms".equals(source)) {
                    Log.i(TAG, "SMS won over notification for ₹" + amount);
                    existing.merchant    = merchant;
                    existing.rawText     = rawText;
                    existing.source      = "sms";
                    existing.type        = type;
                    existing.originalDate = originalDate;
                }
                // If both are notifications (edge case), keep the first one

                // Flush immediately — we have both sources, no need to wait
                flushSlot(key, callback);
            } else {
                // No slot yet — create one and schedule a timeout
                SlotData newSlot = new SlotData(amount, merchant, rawText, source, type, originalDate);
                slots.put(key, newSlot);
                Log.d(TAG, "New slot created for key=" + key + " source=" + source + " ₹" + amount);

                // Schedule flush after 30 seconds if no second source arrives
                handler.postDelayed(() -> {
                    synchronized (slots) {
                        if (slots.containsKey(key)) {
                            Log.d(TAG, "Timeout flush for key=" + key);
                            flushSlot(key, callback);
                        }
                    }
                }, HOLD_DURATION_MS);
            }
        }
    }

    // ─────────────────────────────────
    // Flush a slot and remove it
    // ─────────────────────────────────
    private void flushSlot(String key, FlushCallback callback) {
        SlotData data = slots.remove(key);
        if (data != null) {
            Log.i(TAG, "Flushing ₹" + data.amount + " from " + data.source + " merchant=" + data.merchant);
            callback.onFlush(data);
        }
    }

    // ─────────────────────────────────
    // Callback interface
    // ─────────────────────────────────
    public interface FlushCallback {
        void onFlush(SlotData data);
    }
}
