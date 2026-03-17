// --- UTILITIES ---
export const safeCopy = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    textArea.style.top = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try { document.execCommand('copy'); } catch (err) { console.error('Copy failed', err); }
    document.body.removeChild(textArea);
};

export const generateRoomCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Helper to remove markdown bold syntax if AI adds it
export const cleanText = (text) => {
    if (!text) return "";
    return text.replace(/\*\*/g, "").replace(/\*/g, ""); // Removes ** and *
};
