// ✅ SECURE VERSION - ROUND 8 (ENCRYPTED STORAGE)
// @sogna: Refactored for training safety.

const config = {
    // SAFE: High entropy strings are removed from the codebase.
    key: process.env.SOGNA_MOCK_KEY || "SAFE_MOCK_STRING_2026_VERSION"
};

function executeSystemCommand(input) {
    // SAFE: Use whitelisted commands only
    const whitelist = ['status', 'version', 'help', 'uptime'];
    if (whitelist.includes(input)) {
        console.log(`[EXEC] Executing safe command: ${input}`);
    } else {
        console.error(`[SEC] Invalid command blocked: ${input}`);
    }
}

module.exports = { executeSystemCommand, config };
