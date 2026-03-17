import { useState } from 'react';
import { callGemini } from '../services/ai';
import { cleanText } from '../utils/helpers';

export const useInsightsAI = (members, results, roomName, saveData, setInsights) => {
    // Smart Parsing State
    const [showParseModal, setShowParseModal] = useState(false);
    const [activeMemberId, setActiveMemberId] = useState(null);
    const [parseText, setParseText] = useState('');
    const [isParsing, setIsParsing] = useState(false);
    const [parseError, setParseError] = useState('');

    // Message Drafting State
    const [draftedMessage, setDraftedMessage] = useState('');
    const [isDrafting, setIsDrafting] = useState(false);
    const [showDraftModal, setShowDraftModal] = useState(false);

    // Insights State
    const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);

    // Provide an optional callback if we want logs. For now, empty function.
    const addLog = (m) => {};

    const openSmartAddModal = (id, initialText = '') => {
        setActiveMemberId(id);
        setParseText(initialText);
        setParseError('');
        setShowParseModal(true);
    };

    const handleSmartParse = async () => {
        if (!parseText.trim()) return;
        setIsParsing(true);
        setParseError('');
        try {
            const member = members.find(m => m.id.toString() === activeMemberId.toString());
            const existingExpenses = member ? (member.expenseInput || '') : '';

            const prompt = `
                Analyze the following text and extract ONLY NEW expenditure amounts (deltas) and the number of days absent: "${parseText}".

                CONTEXT:
                Existing recorded expense amounts (Ignore these if they appear in the text): [${existingExpenses}]
                
                STRICT RULES:
                1. SMART DEDUPLICATION: We want to avoid adding the same bill twice. If the text contains an expense (e.g., "Egg 200") and we already have a "200" in the context list that likely corresponds to this item, SKIP it.
                2. SAME PRICE, DIFFERENT ITEMS: If the text says "Milk 15, Choc 15" but the context only has one "15", then you MUST extract the second "15" as a new expense.
                3. NEW ITEMS ONLY: Return ONLY the expenses that are NOT already accounted for in the context list.
                4. MATH: If you see "110+637", treat them as individual amounts.
                5. DATES: Ignore any date numbers (15th, 22 feb, etc.).
                
                Return ONLY a JSON object:
                {
                    "expenses": [number, number, ...],
                    "daysAbsent": number or null
                }

                Example: Context [200, 15]. Text "Egg 200, Milk 15, Choc 15, 9 days absent".
                Output: { "expenses": [15], "daysAbsent": 9 }
            `;

            const result = await callGemini(prompt, addLog);

            // Extract JSON from response (handling potential markdown formatting)
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error("Could not parse AI response");

            const parsed = JSON.parse(jsonMatch[0]);
            const { expenses, daysAbsent } = parsed;

            if ((!expenses || expenses.length === 0) && daysAbsent === null) {
                setParseError("Could not find any expenses or absence days.");
                setIsParsing(false);
                return;
            }

            if (!member) return;

            let finalExpenseInput = member.expenseInput || '';
            if (expenses && expenses.length > 0) {
                const newExpensesString = expenses.join(', ');
                const currentExpenses = finalExpenseInput.toString().trim();
                if (currentExpenses) {
                    const prefix = currentExpenses.endsWith(',') ? currentExpenses : `${currentExpenses}, `;
                    finalExpenseInput = `${prefix} ${newExpensesString} `;
                } else {
                    finalExpenseInput = newExpensesString;
                }
            }

            const updatedMembers = members.map(m =>
                m.id.toString() === activeMemberId.toString()
                    ? {
                        ...m,
                        expenseInput: finalExpenseInput,
                        daysAbsent: daysAbsent !== null ? daysAbsent.toString() : m.daysAbsent
                    }
                    : m
            );

            saveData(updatedMembers, undefined, undefined);
            setShowParseModal(false);
            setParseText('');
        } catch (err) {
            console.error(err);
            setParseError("AI Parsing failed. Try manually.");
        } finally {
            setIsParsing(false);
        }
    };

    const handleDraftMessage = async () => {
        if (!results) return;
        setIsDrafting(true);
        setShowDraftModal(true);
        try {
            const prompt = `
            Act like a dramatic, funny Gen Z Indian friend handling the group accounts. 
            Write a WhatsApp settlement message for the group "${roomName}" in ** Hinglish ** (mix of Hindi and English).

            Data:
            Transactions: ${JSON.stringify(results.transactions)}

            STRICT CONSTRAINTS:
            1. ** Keep it under 50 - 100 words ** (excluding the list).

            Style Guidelines:
            - Tone: Casual, witty, slightly dramatic banter.
            - Slang to use(optional examples): "Bhai", "Yaar", "Paisa nikal", "Gareebi", "Party kab hai?", "Hisab kitab", "Udhari".
            - Intro: Start with something funny like "Guys, hisab ka waqt aa gaya 💀" or "Bhai log, settlement time! 💸".
            - Body: List the transactions clearly(Name ➡️ Name: ₹Amount).
            - Outro: End with a call to action like "Jaldi settle karo, phir party karte hain 🍕" or "GPay fast, I am broke".
            - Use Indian Rupee symbol(₹).
            - Use lots of emojis.
            `;

            const message = await callGemini(prompt, addLog);
            setDraftedMessage(cleanText(message));
        } catch (err) {
            setDraftedMessage("Error generating banter. Try again!");
        } finally {
            setIsDrafting(false);
        }
    };

    const generateInsights = async () => {
        if (!results) return;
        setIsGeneratingInsights(true);

        const richNames = ["Ambani", "Adani", "Tata", "Birla", "Murthy", "Mahindra", "Poonawalla", "Jhunjhunwala"];
        const selectedRichName = richNames[Math.floor(Math.random() * richNames.length)];

        const roastLines = [
            "udhari ka kha-kha ke pet nahi phool gaya tera?",
            "tera hisaab dekh ke calculator bhi sharma gaya hai!",
            "agli baar kidney bech ke hisaab barabar karna padega lagta hai.",
            "itna udhaar toh Vijay Mallya ne bhi nahi liya tha!",
            "dost hai isliye chhod rahe hain, varna police case banta hai ispe!",
            "gareebi hatao yojana ka brand ambassador ban ja tu ab.",
            "bhai/behen maaf kar de, ab toh ATM bhi tujhe dekh ke error dikha deta hai.",
            "kya karega itna paisa bacha ke? Kabr mein leke jayega kya?",
            "Agli baar tu hi sponsor karega pura trip, likh ke lele!"
        ];
        const selectedRoast = roastLines[Math.floor(Math.random() * roastLines.length)];

        const roundedTotalVar = Math.round(results.totalVariable);
        const roundedTotalFixed = Math.round(results.totalFixed);
        const roundedBalances = results.balances.map(m =>
            `${m.name}: Net Balance ${Math.round(m.netBalance)} `
        ).join(', ');

        const prompt = `
            Analyze these expenses for group "${roomName}".
            Total Variable Cost: ₹${roundedTotalVar}
            Total Fixed Cost: ₹${roundedTotalFixed}
            Breakdown:
            ${roundedBalances}
            
            Provide a fun, "roast-style" 3 - bullet summary in ** Hinglish ** for a Gen Z Indian group.
            
            1. Identify the ** "${selectedRichName} of the Group" ** 🤑 (Highest spender / creditor). 
               - ** GENDER CHECK:** If clearly a female name(e.g.Priya, Neha), use "Queen ${selectedRichName}" or "Madam".If male or unsure(e.g.Hasan, Umair, Ankit), use "Bhai" or "Sir".
               - Roast them gently about being rich.
            
            2. Identify the ** "Kanjoos Makkhichoos" ** 🐜 (Lowest spender / debtor). 
               - ** GENDER CHECK:** If clearly female, use "Didi" or "Behen".If male or unsure, use "Bhai" or "Bro".
               - Roast them BADLY for not spending money.

            3. ** Vibe Check ** 🧐: A funny, unhinged observation. 
               - ** MANDATORY:** You MUST include this specific roast phrase naturally in the sentence: ** "${selectedRoast}" ** (Adjust 'bhai/behen' in the phrase based on context.Default to 'bhai' if unsure).
            
            STRICT OUTPUT RULES:
            - ** Round ALL numbers **.No decimals allowed.
            - ** Start DIRECTLY ** with the first emoji.Do NOT say "Here is a roast".
            - Use Indian Rupee symbol(₹). 
        `;

        try {
            const text = await callGemini(prompt, addLog);
            setInsights(cleanText(text));
        } catch (e) {
            setInsights("Insights generate nahi ho paaye. Server lunch pe gaya hai! 🍕");
        } finally {
            setIsGeneratingInsights(false);
        }
    };

    return {
        // Parse Modal State
        showParseModal,
        setShowParseModal,
        activeMemberId,
        openSmartAddModal,
        parseText,
        setParseText,
        isParsing,
        parseError,
        handleSmartParse,

        // Draft Modal State
        showDraftModal,
        setShowDraftModal,
        isDrafting,
        draftedMessage,
        handleDraftMessage,

        // Insights State
        isGeneratingInsights,
        generateInsights
    };
};
