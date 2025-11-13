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
        vectors: { size: 3072, distance: "Cosine" },
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

      // ✅ Index lại kiến thức sau khi tạo (nếu Qdrant available)
      try {
        const isQdrantAvailable = await qdrantClientSingleton.checkAvailability();
        if (isQdrantAvailable) {
          await this.indexBotKnowledge(aibot_id);
          console.log(
            `Knowledge ${newKnowledge._id} created & indexed for bot ${aibot_id}`
          );
        } else {
          console.warn(
            `Knowledge ${newKnowledge._id} created but NOT indexed (Qdrant unavailable)`
          );
        }
      } catch (indexError) {
        console.warn("Failed to index knowledge, but data saved:", indexError.message);
      }

      return newKnowledge;
    } catch (error) {
      console.error("Error creating knowledge:", error);
      throw error;
    }
  }

  // 🔹 Lấy tất cả kiến thức
  async getKnowledges() {
    return await botKnowledgeModel.find().sort({ created_at: -1 });
  }

  // 🔹 Lấy kiến thức theo bot
  async getKnowledgeByBotId(aibot_id) {
    return await botKnowledgeModel.find({ aibot_id }).sort({ created_at: -1 });
  }

  // 🔹 Cập nhật kiến thức
  async updateKnowledge(id, data) {
    const updated = await botKnowledgeModel.findByIdAndUpdate(
      id,
      { title: data.title, content: data.content, tags: data.tags },
      { new: true }
    );

    // Index lại nếu Qdrant available
    if (updated?.aibot_id) {
      try {
        const isQdrantAvailable = await qdrantClientSingleton.checkAvailability();
        if (isQdrantAvailable) {
          await this.indexBotKnowledge(updated.aibot_id);
        } else {
          console.warn("Knowledge updated but NOT indexed (Qdrant unavailable)");
        }
      } catch (indexError) {
        console.warn("Failed to index after update:", indexError.message);
      }
    }

    return updated;
  }

  // 🔹 Xóa kiến thức
  async deleteKnowledge(id) {
    const removed = await botKnowledgeModel.findByIdAndDelete(id);

    // Index lại nếu Qdrant available
    if (removed?.aibot_id) {
      try {
        const isQdrantAvailable = await qdrantClientSingleton.checkAvailability();
        if (isQdrantAvailable) {
          await this.indexBotKnowledge(removed.aibot_id);
        } else {
          console.warn("Knowledge deleted but NOT re-indexed (Qdrant unavailable)");
        }
      } catch (indexError) {
        console.warn("Failed to index after delete:", indexError.message);
      }
    }

    return removed;
  }

  // 🔹 Index toàn bộ kiến thức của 1 bot vào Qdrant
  async indexBotKnowledge(botId) {
    try {
      // Kiểm tra Qdrant availability trước
      const isQdrantAvailable = await qdrantClientSingleton.checkAvailability();
      if (!isQdrantAvailable) {
        console.warn(`Skipping indexing for bot ${botId}: Qdrant unavailable`);
        return { indexed: 0, skipped: true };
      }

      const collectionName = this._getCollectionName(botId);
      const knowledge = await this.getKnowledgeByBotId(botId);

      // 🔥 XÓA collection cũ để tránh duplicate
      try {
        await this.qdrantClient.deleteCollection(collectionName);
        console.log(`🗑️ Deleted old collection: ${collectionName}`);
      } catch (err) {
        // Nếu collection không tồn tại thì bỏ qua
        console.log(`Collection ${collectionName} doesn't exist, creating new one`);
      }

      // Nếu không có kiến thức nào, không cần tạo collection
      if (!knowledge.length) {
        console.log(`No knowledge to index for bot ${botId}`);
        return { indexed: 0 };
      }

      // Tạo collection mới
      await this.qdrantClient.createCollection(collectionName, {
        vectors: { size: 3072, distance: "Cosine" },
      });
      console.log(`✨ Created new collection: ${collectionName}`);

      // Tạo document
      const documents = knowledge.map(
        (k) =>
          new Document({
            pageContent: k.content || "",
            metadata: {
              title: k.title,
              tags: k.tags,
              knowledgeId: k._id.toString(),
              botId: botId.toString(),
            },
          })
      );

      // Chia nhỏ văn bản
      const splitDocs = await this.textSplitter.splitDocuments(documents);

      // Gắn vào vector store
      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        this.embeddings,
        { client: this.qdrantClient, collectionName }
      );

      await vectorStore.addDocuments(splitDocs);
      console.log(`✅ Indexed ${splitDocs.length} docs for bot ${botId}`);
      return { indexed: splitDocs.length };
    } catch (err) {
      console.error("❌ Error indexing knowledge:", err.message);
      // Không throw error để không làm crash service
      return { indexed: 0, error: err.message };
    }
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
