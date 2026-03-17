import { GoogleGenerativeAI } from "@google/generative-ai";
import { getEnv } from "../utils/env";

const apiKey = getEnv("VITE_GEMINI_API_KEY");
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Calls the Gemini AI model with a prompt.
 * Uses gemini-2.0-flash-lite as the primary model and gemini-1.5-flash as a fallback.
 * 
 * @param {string} prompt - The prompt to send to the model.
 * @param {function} logCallback - Optional callback for logging attempts and errors.
 * @returns {Promise<string>} - The generated text response.
 */
export const callGemini = async (prompt, logCallback = () => { }) => {
    const performRequest = async (modelName) => {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    };

    try {
        logCallback(`Attempting Primary Model (gemini-2.0-flash)...`);
        return await performRequest("gemini-2.0-flash");
    } catch (primaryError) {
        logCallback(`Primary Failed (${primaryError.message}). Trying fallback (gemini-1.5-flash)...`);
        try {
            return await performRequest("gemini-1.5-flash");
        } catch (fallbackError) {
            logCallback(`CRITICAL ERROR: ${fallbackError.message}`);
            throw new Error("AI Service Unavailable");
        }
    }
};

/**
 * Parses a receipt image to extract items, prices, and tax.
 * 
 * @param {string} base64Image - The base64 representation of the image.
 * @param {string} mimeType - The mime type of the image (e.g., 'image/jpeg').
 * @param {function} logCallback - Optional callback for logging attempts and errors.
 * @returns {Promise<Object>} - Parsed JSON containing items and tax.
 */
export const parseReceiptImage = async (base64Image, mimeType, logCallback = () => { }) => {
    const prompt = `
        Analyze this receipt. Extract all purchased items with their exact quantities and the TOTAL AMOUNT for that row.
        CRITICAL: The "price" field must be the TOTAL AMOUNT for that row (Quantity * Unit Price). Do NOT return just the unit price if qty > 1.
        
        Also, locate the Subtotal, any specific Taxes (CGST, SGST, Service Charge, etc.), and the Grand Total.
        
        Return the exact data strictly as a raw JSON object string (do not use markdown formatting like \`\`\`json).
        Look for actual food items, ignore packaging water or minor incidentals if they cost zero, but include them if they cost money.
        
        Structure the JSON exactly like this:
        {
            "items": [
                { "name": "Mutton Biryani", "qty": 2, "price": 780.00 }
            ],
            "subtotal": 100.00,
            "taxAndTip": 10.00,
            "total": 110.00
        }
    `;

    const getParts = () => [
        { text: prompt },
        {
            inlineData: {
                data: base64Image,
                mimeType
            }
        }
    ];

    const performRequest = async (modelName) => {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(getParts());
        const response = await result.response;
        const textStr = response.text();

        try {
            // Clean up potential markdown formatting from AI output
            let cleanedStr = textStr.trim();
            if (cleanedStr.startsWith('```json')) {
                cleanedStr = cleanedStr.replace(/^```json/g, '');
            } else if (cleanedStr.startsWith('```')) {
                cleanedStr = cleanedStr.replace(/^```/g, '');
            }
            if (cleanedStr.endsWith('```')) {
                cleanedStr = cleanedStr.replace(/```$/g, '');
            }
            return JSON.parse(cleanedStr.trim());
        } catch (e) {
            console.error("Failed to parse JSON from AI response:", textStr);
            throw new Error("Failed to parse receipt data. Please ensure it's a clear image of a receipt.");
        }
    };

    try {
        logCallback("Parsing Receipt Image (gemini-2.0-flash)...");
        return await performRequest("gemini-2.0-flash");
    } catch (error) {
        logCallback(`Image Parsing Failed (${error.message}). Trying gemini-1.5-flash...`);
        try {
            return await performRequest("gemini-1.5-flash");
        } catch (fallbackError) {
            logCallback(`CRITICAL ERROR: ${fallbackError.message}`);
            throw new Error("AI Vision Service Unavailable: " + fallbackError.message);
        }
    }
};
