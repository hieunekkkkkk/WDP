// jobs/syncClerkUsers.js
const { getClerkClient } = require('../middleware/clerkClient');
const User = require('../entity/module/user.model');

async function syncClerkUsers() {
    const clerk = await getClerkClient();

    console.log('[SYNC] Bắt đầu đồng bộ người dùng từ Clerk...');
    let page = 1;
    const limit = 100;

    while (true) {
        const { data: users } = await clerk.users.getUserList({ limit, offset: (page - 1) * limit });
        if (!users.length) break;

        for (const u of users) {
            await User.findOneAndUpdate(
                { clerkId: u.id },
                {
                    email: u.emailAddresses[0]?.emailAddress,
                    fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                    role: u.publicMetadata?.role || 'client',
                    imageUrl: u.imageUrl,
                    locked: u.publicMetadata?.locked || false,
                    publicMetadata: u.publicMetadata || {},
                    privateMetadata: u.privateMetadata || {},
                    lastSyncedAt: new Date(),
                },
                { upsert: true }
            );
        }

        if (users.length < limit) break;
        page++;
    }

    console.log('[SYNC] ✅ Hoàn tất đồng bộ Clerk → MongoDB');
}

module.exports = syncClerkUsers;
