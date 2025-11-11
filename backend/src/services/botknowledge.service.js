require("dotenv").config();
const botKnowledgeModel = require("../entity/module/botknowledge.model");
const fileToText = require("../utils/fileToText");
const qdrantClientSingleton = require("../utils/qdrantClient");
const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");
const { QdrantVectorStore } = require("@langchain/qdrant");
const { Document } = require("langchain/document");
const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");

class BotKnowledgeService {
  constructor() {
    this.qdrantClient = qdrantClientSingleton.getClient();
    this.embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "gemini-embedding-001",
    });
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
  }

  _getCollectionName(botId) {
    return `bot_${botId}_knowledge`;
  }

  async _ensureCollection(botId) {
    const collectionName = this._getCollectionName(botId);
    const collections = await this.qdrantClient.getCollections();
    const exists = collections.collections.some(
      (c) => c.name === collectionName
    );
    if (!exists) {
      await this.qdrantClient.createCollection(collectionName, {
        vectors: { size: 768, distance: "Cosine" },
      });
      console.log(`Created Qdrant collection: ${collectionName}`);
    }
    return collectionName;
  }

  // 🔹 Tạo kiến thức
  async createKnowledge(aibot_id, data, filePath = null) {
    try {
      let content = data.content;
      if (filePath) content = await fileToText(filePath);

      const newKnowledge = new botKnowledgeModel({
        aibot_id,
        created_by: data.created_by,
        title: data.title,
        content,
        tags: data.tags,
      });

      await newKnowledge.save();

      // ✅ Index lại kiến thức sau khi tạo
      await this.indexBotKnowledge(aibot_id);

      console.log(
        `Knowledge ${newKnowledge._id} created & indexed for bot ${aibot_id}`
      );
      return newKnowledge;
    } catch (error) {
      console.error("Error creating knowledge:", error);
      throw error;
    }
  }

    async _ensureCollection(botId) {
        const collectionName = this._getCollectionName(botId);
        const collections = await this.qdrantClient.getCollections();
        const exists = collections.collections.some(c => c.name === collectionName);
        if (!exists) {
            await this.qdrantClient.createCollection(collectionName, {
                vectors: { size: 3072, distance: 'Cosine' },
            });
            console.log(`Created Qdrant collection: ${collectionName}`);
        }
        return collectionName;
    }
  

  // 🔹 Tìm kiếm trong Qdrant
  async searchKnowledge(botId, query, limit = 5) {
    const collectionName = this._getCollectionName(botId);
    const vectorStore = await QdrantVectorStore.fromExistingCollection(
      this.embeddings,
      { client: this.qdrantClient, collectionName }
    );
    const results = await vectorStore.similaritySearch(query, limit);
    return results.map((doc) => ({
      content: doc.pageContent,
      metadata: doc.metadata,
    }));
  }
}

module.exports = new BotKnowledgeService();
