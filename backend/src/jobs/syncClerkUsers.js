// jobs/syncClerkUsers.js
const { getClerkClient } = require('../middleware/clerkClient');
const User = require('../entity/module/user.model');

async function syncClerkUsers() {
    const clerk = await getClerkClient();

    console.log('[SYNC] Bắt đầu đồng bộ người dùng từ Clerk...');
    let page = 1;
    const limit = 100;

    while (true) {
        // Lấy dữ liệu từ Clerk (có thể là mảng hoặc object)
        const result = await clerk.users.getUserList({
            limit,
            offset: (page - 1) * limit,
        });

        // Chuẩn hoá để lấy ra danh sách user
        const users = Array.isArray(result) ? result : result?.data || [];

        if (!users || users.length === 0) {
            console.log(`[SYNC] Không còn user nào ở trang ${page}. Dừng đồng bộ.`);
            break;
        }

        console.log(`[SYNC] Đồng bộ ${users.length} user (trang ${page})...`);

        for (const u of users) {
            try {
                await User.findOneAndUpdate(
                    { clerkId: u.id },
                    {
                        email: u.emailAddresses?.[0]?.emailAddress || null,
                        fullName: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
                        role: u.publicMetadata?.role || 'client',
                        imageUrl: u.imageUrl,
                        locked: u.publicMetadata?.locked || false,
                        publicMetadata: u.publicMetadata || {},
                        privateMetadata: u.privateMetadata || {},
                        lastSyncedAt: new Date(),
                    },
                    { upsert: true, new: true }
                );
            } catch (err) {
                console.error(`[SYNC] ❌ Lỗi khi đồng bộ user ${u.id}:`, err.message);
            }
        }

        if (users.length < limit) {
            console.log('[SYNC] ✅ Đã đồng bộ toàn bộ người dùng.');
            break;
        }

        page++;
    }

    console.log('[SYNC] ✅ Hoàn tất đồng bộ Clerk → MongoDB');
}

module.exports = syncClerkUsers;
