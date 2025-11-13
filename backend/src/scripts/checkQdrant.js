require('dotenv').config();
const { QdrantClient } = require('@qdrant/js-client-rest');

const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';

async function checkQdrantConnection() {
    console.log('🔍 Checking Qdrant connection...');
    console.log(`📍 Qdrant URL: ${qdrantUrl}`);

    const client = new QdrantClient({
        url: qdrantUrl,
        timeout: 5000,
    });

    try {
        const collections = await client.getCollections();
        console.log('✅ Qdrant is running!');
        console.log(`📊 Total collections: ${collections.collections.length}`);

        if (collections.collections.length > 0) {
            console.log('📋 Collections:');
            collections.collections.forEach((col, idx) => {
                console.log(`   ${idx + 1}. ${col.name}`);
            });
        }

        return true;
    } catch (error) {
        console.error('❌ Qdrant connection failed!');
        console.error(`   Error: ${error.message}`);

        if (error.message.includes('ECONNREFUSED') || error.message.includes('timeout')) {
            console.log('\n💡 Suggestions:');
            console.log('   1. Start Qdrant with Docker:');
            console.log('      docker run -d --name qdrant -p 6333:6333 -p 6334:6334 qdrant/qdrant:latest');
            console.log('   2. Or start all services:');
            console.log('      docker-compose up -d');
            console.log('   3. Check Qdrant dashboard: http://localhost:6333/dashboard');
        }

        return false;
    }
}

checkQdrantConnection();
