package com.fairsplit.app;

import java.util.regex.Pattern;

/**
 * Gold-Standard Allow-List Validator.
 * Only accepts messages that match one of the 10 known banking transaction structures.
 * Anything that does NOT match is silently ignored — treated as spam by default.
 */
public class StructureValidator {

    // ─────────────────────────────────────────────────────────────────
    // THE 10 GOLDEN STRUCTURES (order matters — most specific first)
    // ─────────────────────────────────────────────────────────────────

    private static final Pattern[] GOLDEN_PATTERNS = {

        // 1. Bandhan / standard: "[INR/₹] Amount debited/credited from/to A/c..."
        Pattern.compile(
            "(?:inr|rs\\.?|₹)\\s*[\\d,]+(?:\\.\\d{1,2})?\\s+(?:debited|credited|deposited|withdrawn)\\s+(?:from|to)",
            Pattern.CASE_INSENSITIVE
        ),

        // 2. Axis Bank card swipe: "Spent INR 830" or "Paid Rs. 500"
        Pattern.compile(
            "(?:spent|paid|sent|received)\\s+(?:inr|rs\\.?|₹)\\s*[\\d,]+",
            Pattern.CASE_INSENSITIVE
        ),

        // 3. UPI routing string: "UPI/DR/..." or "UPI/CR/..."
        Pattern.compile(
            "UPI/(?:DR|CR|P2A|P2M|P2P)/[^/\\s]+",
            Pattern.CASE_INSENSITIVE
        ),

        // 4. Axis UPI transfer: "A/c has been debited/credited towards [Name] for INR X"
        Pattern.compile(
            "A/c\\s+has\\s+been\\s+(?:debited|credited)\\s+towards\\s+.+?\\s+for\\s+(?:inr|rs\\.?|₹)\\s*[\\d,]+",
            Pattern.CASE_INSENSITIVE
        ),

        // 5. GPay/PhonePe receipt: "[Name] has sent ₹Amount to your bank account"
        Pattern.compile(
            ".+\\s+has\\s+sent\\s+(?:inr|rs\\.?|₹)\\s*[\\d,]+\\s+to\\s+your\\s+(?:bank\\s+)?account",
            Pattern.CASE_INSENSITIVE
        ),

        // 6. Generic "payment received/successful": "Your payment of ₹Amount is successful"
        Pattern.compile(
            "(?:payment|transfer)\\s+of\\s+(?:inr|rs\\.?|₹)\\s*[\\d,]+\\s+(?:is\\s+)?(?:successful|received|complete)",
            Pattern.CASE_INSENSITIVE
        ),

        // 7. "₹Amount sent to [UPI ID]" — simplified GPay style
        Pattern.compile(
            "(?:inr|rs\\.?|₹)\\s*[\\d,]+\\s+(?:sent|paid)\\s+to\\s+[\\w.@-]+",
            Pattern.CASE_INSENSITIVE
        ),

        // 8. SBI/HDFC/ICICI transfer: "A/c XXXX: ₹Amount withdrawn/transferred"
        Pattern.compile(
            "A/c\\s+[X\\d]+\\s*[:\\-]\\s*(?:inr|rs\\.?|₹)\\s*[\\d,]+\\s+(?:withdrawn|transferred|debited|credited)",
            Pattern.CASE_INSENSITIVE
        ),

        // 9. "Amount [action] towards/from/to [A/c or UPI]"
        Pattern.compile(
            "(?:inr|rs\\.?|₹)\\s*[\\d,]+\\s+(?:debited|credited|deposited)\\s+towards",
            Pattern.CASE_INSENSITIVE
        ),

        // 10. PhonePe/Paytm: "Payment received of ₹Amount from [Name]"
        Pattern.compile(
            "(?:payment|amount)\\s+received\\s+(?:of\\s+)?(?:inr|rs\\.?|₹)\\s*[\\d,]+",
            Pattern.CASE_INSENSITIVE
        ),
    };

    /**
     * Returns true only if the message matches at least one Golden Structure.
     * If false, the message should be ignored entirely.
     */
    public static boolean isValid(String text) {
        if (text == null || text.isEmpty()) return false;
        for (Pattern pattern : GOLDEN_PATTERNS) {
            if (pattern.matcher(text).find()) {
                return true;
            }
        }
        return false;
    }
}
