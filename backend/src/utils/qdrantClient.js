require('dotenv').config();
const { QdrantClient } = require('@qdrant/js-client-rest');

class QdrantClientSingleton {
    constructor() {
        if (QdrantClientSingleton.instance) {
            return QdrantClientSingleton.instance;
        }

        this.client = null;
        this.isAvailable = false;
        this.connectionChecked = false;
        this.connectionCheckPromise = null;

        // Khởi tạo client nhưng KHÔNG check connection ngay
        this.client = new QdrantClient({
            url: process.env.QDRANT_URL || 'http://localhost:6333',
            timeout: 30000, // 30s timeout
        });

        QdrantClientSingleton.instance = this;
    }

    // Lazy check connection - chỉ check khi cần
    async ensureConnection() {
        // Nếu đã check rồi thì return luôn
        if (this.connectionChecked) {
            return this.isAvailable;
        }

        // Nếu đang check thì chờ promise hiện tại
        if (this.connectionCheckPromise) {
            return this.connectionCheckPromise;
        }

        // Check connection lần đầu
        this.connectionCheckPromise = (async () => {
            try {
                await this.client.getCollections();
                this.isAvailable = true;
                this.connectionChecked = true;
                console.log('✅ Qdrant connected successfully');
            } catch (err) {
                this.isAvailable = false;
                this.connectionChecked = true;
                console.warn('⚠️ Qdrant not available, bot will work in fallback mode:', err.message);
            }
            return this.isAvailable;
        })();

        return this.connectionCheckPromise;
    }

    getClient() {
        return this.client;
    }

    isQdrantAvailable() {
        return this.isAvailable;
    }

    // Async version - check connection trước khi return status
    async checkAvailability() {
        await this.ensureConnection();
        return this.isAvailable;
    }
}

// Export singleton instance
module.exports = new QdrantClientSingleton();
