// src/controllers/sync.controller.js
const syncClerkUsers  = require('../../jobs/syncClerkUsers');

async function handleSyncClerkUsers(req, res) {
    try {
        const result = await syncClerkUsers();
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

module.exports = { handleSyncClerkUsers };
