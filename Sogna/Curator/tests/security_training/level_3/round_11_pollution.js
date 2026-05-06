// ✅ SECURE VERSION - ROUND 11 (STRICT MERGE)
// @Sogna: Refactored for training safety with Prototype Protection.

function safeDeepMerge(target, source) {
    for (const key in source) {
        // SAFE: Mandatory filter for Prototype Pollution
        if (key === '__proto__' || key === 'constructor') continue;

        if (Object.prototype.hasOwnProperty.call(source, key)) {
            if (typeof source[key] === 'object' && source[key] !== null) {
                target[key] = target[key] || {};
                safeDeepMerge(target[key], source[key]);
            } else {
                target[key] = source[key];
            }
        }
    }
    return target;
}

const userConfig = { theme: "dark" };
const baseConfig = { theme: "light" };

safeDeepMerge(baseConfig, userConfig);
console.log(`[SYSTEM] Configuration merged securely.`);

module.exports = { safeDeepMerge };
