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


  async getKnowledges() {
    return await botKnowledgeModel.find().sort({ created_at: -1 });
  }


  async getKnowledgeByBotId(aibot_id) {
    return await botKnowledgeModel.find({ aibot_id }).sort({ created_at: -1 });
  }


  async updateKnowledge(id, data) {
    const updated = await botKnowledgeModel.findByIdAndUpdate(
      id,
      { title: data.title, content: data.content, tags: data.tags },
      { new: true }
    );

    // Re-index toàn bộ knowledge của bot (xóa collection và tạo lại từ DB)
    if (updated?.aibot_id) {
      try {
        const isQdrantAvailable = await qdrantClientSingleton.checkAvailability();
        if (isQdrantAvailable) {
          console.log(`🔄 Re-indexing all knowledge for bot ${updated.aibot_id} after update`);
          await this.indexBotKnowledge(updated.aibot_id);
          console.log(`✅ Successfully re-indexed bot ${updated.aibot_id}`);
        } else {
          console.warn("Knowledge updated but NOT indexed (Qdrant unavailable)");
        }
      } catch (indexError) {
        console.warn("Failed to index after update:", indexError.message);
        throw new Error(`Qdrant indexing failed: ${indexError.message}`);
      }
    }

    return updated;
  }


  async deleteKnowledge(id) {
    const removed = await botKnowledgeModel.findByIdAndDelete(id);

    // Re-index toàn bộ knowledge của bot (xóa collection và tạo lại từ DB)
    if (removed?.aibot_id) {
      try {
        const isQdrantAvailable = await qdrantClientSingleton.checkAvailability();
        if (isQdrantAvailable) {
          console.log(`🔄 Re-indexing all knowledge for bot ${removed.aibot_id} after delete`);
          await this.indexBotKnowledge(removed.aibot_id);
          console.log(`✅ Successfully re-indexed bot ${removed.aibot_id}`);
        } else {
          console.warn("Knowledge deleted but NOT re-indexed (Qdrant unavailable)");
        }
      } catch (indexError) {
        console.warn("Failed to index after delete:", indexError.message);
        throw new Error(`Qdrant indexing failed: ${indexError.message}`);
      }
    }

    return removed;
  }


  async indexBotKnowledge(botId) {
    try {

      const isQdrantAvailable = await qdrantClientSingleton.checkAvailability();
      if (!isQdrantAvailable) {
        console.warn(`Skipping indexing for bot ${botId}: Qdrant unavailable`);
        return { indexed: 0, skipped: true };
      }

      const collectionName = this._getCollectionName(botId);
      const knowledge = await this.getKnowledgeByBotId(botId);


      try {
        await this.qdrantClient.deleteCollection(collectionName);
        console.log(`🗑️ Deleted old collection: ${collectionName}`);
      } catch (err) {

        console.log(`Collection ${collectionName} doesn't exist, creating new one`);
      }


      if (!knowledge.length) {
        console.log(`No knowledge to index for bot ${botId}`);
        return { indexed: 0 };
      }


      await this.qdrantClient.createCollection(collectionName, {
        vectors: { size: 3072, distance: "Cosine" },
      });
      console.log(`✨ Created new collection: ${collectionName}`);


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


      const splitDocs = await this.textSplitter.splitDocuments(documents);


      const vectorStore = await QdrantVectorStore.fromExistingCollection(
        this.embeddings,
        { client: this.qdrantClient, collectionName }
      );

      await vectorStore.addDocuments(splitDocs);
      console.log(`✅ Indexed ${splitDocs.length} docs for bot ${botId}`);
      return { indexed: splitDocs.length };
    } catch (err) {
      console.error("❌ Error indexing knowledge:", err.message);

      return { indexed: 0, error: err.message };
    }
  }

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
