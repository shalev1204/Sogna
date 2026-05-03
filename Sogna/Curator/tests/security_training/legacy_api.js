// ✅ SECURE LEGACY API
// @sogna: Refactored for training safety.

const db = { find: () => {} };

function getUser(req, res) {
    // SAFE: Ownership validation
    const currentUserId = req.auth ? req.auth.user.id : null;
    if (req.params.id !== currentUserId) {
        return res.status(403).send("Forbidden: You do not own this resource.");
    }
    
    const query = { id: req.params.id };
    db.find(query, (err, user) => {
        res.json(user);
    });
}

function safeCompute(req, res) {
    const { op, a, b } = req.body;
    // SAFE: Deterministic logic instead of dangerous eval
    if (op === 'add') {
        return res.json({ result: a + b });
    }
    res.status(400).send("Invalid Operation");
}

module.exports = { getUser, safeCompute };
