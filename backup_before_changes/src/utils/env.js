// --- ENV VAR UTILITY ---
// Helper to safely access env vars in both Vite and non-Vite environments
export const getEnv = (key) => {
    try {
        // Check if import.meta.env exists (Vite)
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            return import.meta.env[key] || "";
        }
    } catch (e) {
        // Ignore errors in environments that don't support import.meta
    }
    return "";
};
