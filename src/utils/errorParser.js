/**
 * Maps raw, chaotic technical errors into clean, user-friendly instructions.
 * 
 * @param {Error|String} err - The caught error object or message string
 * @param {String} context - Where the error occurred ('receipt', 'smart_parse', 'draft', 'insights', 'general')
 * @returns {String} - A clean, human-readable error string
 */
export const parseAIError = (err, context = 'general') => {
    const rawMsg = err?.message || err?.toString() || '';
    const msg = rawMsg.toLowerCase();

    // 1. JSON Parsing Errors
    // This happens heavily when Gemini returns a conversational response (e.g. "I can't read this receipt")
    // instead of the strict JSON format our codebase requires.
    if (msg.includes('json') || msg.includes('unexpected token')) {
        if (context === 'receipt') {
            return "We couldn't detect a valid receipt. Please make sure the image is clear and contains readable prices.";
        }
        if (context === 'smart_parse') {
            return "The AI couldn't parse any expenses from that text. Try phrasing it more simply like: 'Milk 50, Eggs 20'.";
        }
        return "The AI returned an unrecognizable format. Please try again.";
    }

    // 2. API / Rate Limiting 
    if (msg.includes('429') || msg.includes('quota') || msg.includes('too many requests')) {
        return "The AI engine is currently busy. Please wait a few moments and try again.";
    }

    // 3. Network or Failed Fetches
    if (msg.includes('network') || msg.includes('fetch') || msg.includes('failed to fetch')) {
        return "Connection failed. Please check your internet connection and try again.";
    }

    // 4. Default Context-Specific Fallbacks If Exact Error Unknown
    if (context === 'receipt') {
        return "Failed to analyze the image. Please try a clearer picture.";
    }
    if (context === 'draft') {
        return "Failed to draft the message. The server might be busy.";
    }
    if (context === 'insights') {
        return "Insights generation failed. The roast engine is taking a break!";
    }

    // 5. Ultimate Fallback
    return "An unexpected error occurred. Please try again.";
};
