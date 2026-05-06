// ✅ SECURE DATA TEMPLATE
// @Sogna: Refactored for training safety with DLP compliance.

const AWS_CONFIG = {
    // SAFE: Using placeholders instead of real/high-entropy keys.
    ACCESS_KEY_ID: process.env.SOGNA_AWS_ID || "MOCK_AWS_ACCESS_KEY_2026",
    SECRET_ACCESS_KEY: process.env.SOGNA_AWS_SECRET || "MOCK_AWS_SECRET_KEY_TEMPLATE"
};

module.exports = { AWS_CONFIG };
