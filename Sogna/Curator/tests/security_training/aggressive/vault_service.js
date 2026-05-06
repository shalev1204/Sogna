// ✅ SECURE VAULT
// @Sogna: Refactored for training safety.

const VAULT_KEYS = {
    // SAFE: Using environment variables for secrets.
    MOCK_SECRET: process.env.VAULT_SECRET || "MOCK_VAULT_KEY_TEMPLATE_2026_SOGNA"
};

module.exports = { VAULT_KEYS };
