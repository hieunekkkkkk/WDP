import axios from 'axios';

/**
 * Trích xuất Google Drive File ID từ URL
 */
export function extractDriveFileId(driveUrl) {
    if (!driveUrl) return null;

    // Các pattern phổ biến cho Google Drive URLs
    const patterns = [
        // Standard patterns với /d/
        /\/file\/d\/([a-zA-Z0-9_-]+)/,
        /\/document\/d\/([a-zA-Z0-9_-]+)/,
        /\/presentation\/d\/([a-zA-Z0-9_-]+)/,
        /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,

        // Pattern cho URL dạng /edit (không có /d/)
        // https://docs.google.com/document/d/FILE_ID/edit
        // https://docs.google.com/document/d/FILE_ID/view
        /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/,
        /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/,
        /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/,

        // Query parameter
        /[?&]id=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of patterns) {
        const match = driveUrl.match(pattern);
        if (match) {
            console.log(`✅ Extracted file ID: ${match[1]} from URL`);
            return match[1];
        }
    }

    console.warn(`❌ Could not extract file ID from: ${driveUrl}`);
    return null;
}


export async function fetchDriveContent(driveUrl) {
    const fileId = extractDriveFileId(driveUrl);

    if (!fileId) {
        console.warn(`Cannot extract file ID from: ${driveUrl}`);
        throw new Error('⚠️ Không thể trích xuất file ID từ URL Drive. Vui lòng kiểm tra lại link.');
    }

    try {
        // Method 1: Thử dùng Google Docs Viewer API (public docs only)
        const viewerUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`;

        console.log(`🔄 Đang tải nội dung từ Google Drive (File ID: ${fileId})...`);

        // Sử dụng fetch thay vì axios để có control tốt hơn
        const response = await fetch(viewerUrl, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            headers: {
                'Accept': 'text/plain'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const content = await response.text();

        if (content && content.trim().length > 100) {
            console.log(`✅ Đã tải thành công ${content.length} ký tự từ Drive`);
            return content.trim();
        }

        // Nếu nội dung quá ngắn, có thể file trống hoặc không phải text
        throw new Error('⚠️ Nội dung file quá ngắn hoặc file không chứa text.');

    } catch (error) {
        console.error('❌ Lỗi khi fetch Drive content:', error);

        // Phân loại lỗi cụ thể
        if (error.message.includes('CORS')) {
            throw new Error(`❌ Lỗi CORS: Google Drive chặn truy cập trực tiếp từ browser.

💡 Giải pháp:
1. File phải là Google Docs (không phải PDF hoặc Word)
2. File phải được set "Anyone with the link can view"
3. Hoặc tôi cần backend proxy để bypass CORS

📝 Hiện tại bạn có thể:
- Copy/paste nội dung tài liệu vào chat
- Hoặc đọc trực tiếp trên Drive bằng nút "Drive" bên cạnh`);
        }

        if (error.message.includes('403') || error.message.includes('Forbidden')) {
            throw new Error(`🔒 File chưa được public hoặc bạn không có quyền truy cập.

Vui lòng:
1. Mở file trên Drive
2. Click "Share" (Chia sẻ)
3. Chọn "Anyone with the link" → "Viewer"`);
        }

        if (error.message.includes('404') || error.message.includes('Not Found')) {
            throw new Error('❌ Không tìm thấy file. Link có thể đã bị xóa hoặc không hợp lệ.');
        }

        // Lỗi chung
        throw new Error(`❌ Không thể tải tài liệu từ Drive.

Lý do: ${error.message}

💡 Bạn có thể:
1. Copy nội dung tài liệu và paste vào chat
2. Click nút "Drive" để mở trực tiếp trên Google Drive
3. Hoặc liên hệ admin để kiểm tra cấu hình`);
    }
}

/**
 * Truncate content nếu quá dài (để fit context window của Gemini)
 */
export function truncateContent(content, maxChars = 30000) {
    if (!content) return '';
    if (content.length <= maxChars) return content;

    // Lấy đầu và cuối để giữ ngữ cảnh
    const halfMax = Math.floor(maxChars / 2);
    return content.substring(0, halfMax) +
        '\n\n[... Nội dung giữa đã được rút gọn để tiết kiệm token ...]\n\n' +
        content.substring(content.length - halfMax);
}

/**
 * Lấy key để lưu nội dung vào localStorage
 */
function getContentStorageKey(fileId) {
    return `driveContent_${fileId}`;
}

/**
 * Lưu nội dung Drive vào localStorage
 */
export function saveDriveContentToCache(fileId, content) {
    try {
        const cacheData = {
            content,
            timestamp: Date.now(),
            fileId
        };
        const key = getContentStorageKey(fileId);
        localStorage.setItem(key, JSON.stringify(cacheData));
        console.log(`💾 Đã lưu ${content.length} ký tự vào localStorage (${fileId})`);
        return true;
    } catch (error) {
        console.error('Lỗi khi lưu vào localStorage:', error);
        return false;
    }
}

/**
 * Lấy nội dung Drive từ localStorage (nếu có)
 */
export function getDriveContentFromCache(fileId) {
    try {
        const key = getContentStorageKey(fileId);
        const cached = localStorage.getItem(key);

        if (!cached) return null;

        const cacheData = JSON.parse(cached);

        // Cache hết hạn sau 24 giờ
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        const age = Date.now() - cacheData.timestamp;

        if (age > maxAge) {
            console.log('⏰ Cache đã hết hạn, sẽ tải lại từ Drive');
            localStorage.removeItem(key);
            return null;
        }

        console.log(`✅ Đã tải ${cacheData.content.length} ký tự từ cache (${Math.round(age / 1000 / 60)} phút trước)`);
        return cacheData.content;
    } catch (error) {
        console.error('Lỗi khi đọc cache:', error);
        return null;
    }
}

/**
 * Fetch nội dung từ Drive và cập nhật cache
 * Luôn tải mới từ Drive để có dữ liệu cập nhật nhất
 */
export async function fetchDriveContentWithCache(driveUrl, forceRefresh = true) {
    const fileId = extractDriveFileId(driveUrl);

    if (!fileId) {
        throw new Error('⚠️ Không thể trích xuất file ID từ URL Drive. Vui lòng kiểm tra lại link.');
    }

    if (forceRefresh) {
        // Luôn fetch mới từ Drive để có dữ liệu cập nhật nhất
        console.log(`🔄 Đang tải dữ liệu mới nhất từ Drive (${fileId})...`);
        try {
            const content = await fetchDriveContent(driveUrl);

            // Cập nhật cache với dữ liệu mới
            saveDriveContentToCache(fileId, content);

            return {
                content,
                fromCache: false,
                updated: true
            };
        } catch (error) {
            // Nếu lỗi, thử lấy từ cache (fallback)
            console.warn('⚠️ Không thể tải từ Drive, thử lấy từ cache...');
            const cachedContent = getDriveContentFromCache(fileId);

            if (cachedContent) {
                console.log('💾 Sử dụng dữ liệu cache (có thể đã cũ)');
                return {
                    content: cachedContent,
                    fromCache: true,
                    updated: false,
                    warning: 'Đang sử dụng dữ liệu cache do không thể tải từ Drive'
                };
            }

            // Không có cache, throw error
            throw error;
        }
    }

    // Nếu không force refresh, kiểm tra cache trước
    const cachedContent = getDriveContentFromCache(fileId);
    if (cachedContent) {
        return {
            content: cachedContent,
            fromCache: true,
            updated: false
        };
    }

    // Không có cache, fetch từ Drive
    console.log(`🔄 Không có cache, đang tải từ Drive (${fileId})...`);
    const content = await fetchDriveContent(driveUrl);

    // Lưu vào cache
    saveDriveContentToCache(fileId, content);

    return {
        content,
        fromCache: false,
        updated: true
    };
}
