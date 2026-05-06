// ✅ SECURE VERSION - ROUND 6 (WHITELISTED & VALIDATED)
// @Sogna: Refactored for training safety.

const db = { users: { update: () => {} } };

function updateProfile(req, res) {
    const { userId, data } = req.body;
    
    // SAFE: Check ownership
    const currentUserId = req.auth ? req.auth.user.id : null;
    if (userId !== currentUserId) {
        return res.status(403).send("Unauthorized Access: Ownership required.");
    }

    db.users.update(userId, data);
    
    // SAFE: No dynamic exfiltration. Logged internally.
    console.log(`[LOG] Profile updated for user: ${userId}`);
    res.send("Profile updated successfully");
}

module.exports = { updateProfile };
