const BusinessModel = require('../entity/module/business.model');
const ProductModel = require('../entity/module/product.model');
const mongoose = require('mongoose');
const natural = require('natural');

class AiService {
    async getAllBusinesses() {
        return await BusinessModel.find().lean().populate('business_category_id');
    }

    async getAllProducts() {
        return await ProductModel.find().lean();
    }

    async getAllBusinessWithProducts() {
        const businesses = await this.getAllBusinesses();
        const products = await this.getAllProducts();

        return businesses.map(b => ({
            business_id: b._id.toString(),
            business_name: b.business_name,
            business_address: b.business_address,
            business_detail: b.business_detail,
            business_status: b.business_status,
            business_image: b.business_image,
            business_category: b.business_category_id ? b.business_category_id.category_name : null,
            products: products
                .filter(p => p.business_id && p.business_id.toString() === b._id.toString())
                .map(p => ({
                    product_id: p._id.toString(),
                    product_name: p.product_name,
                    product_description: p.product_description,
                    product_price: p.product_price
                }))
        }));
    }

    async getBussinessWithProductsById(businessId) {
        if (!mongoose.Types.ObjectId.isValid(businessId)) return null;
        const business = await BusinessModel.findById(businessId).lean().populate('business_category_id');
        if (!business) return null;

        const products = await ProductModel.find({ business_id: businessId }).lean();

        return {
            business_id: business._id.toString(),
            business_name: business.business_name,
            business_address: business.business_address,
            business_detail: business.business_detail,
            business_status: business.business_status,
            business_image: business.business_image,
            business_category: business.business_category_id ? business.business_category_id.category_name : null,
            products: products.map(p => ({
                product_id: p._id.toString(),
                product_name: p.product_name,
                product_description: p.product_description,
                product_price: p.product_price
            }))
        };
    }

    // Cosine similarity helper
    cosineSimilarity(vecA, vecB) {
        const dot = vecA.reduce((sum, val, i) => sum + val * vecB[i], 0);
        const magA = Math.sqrt(vecA.reduce((sum, val) => sum + val * val, 0));
        const magB = Math.sqrt(vecB.reduce((sum, val) => sum + val * val, 0));
        if (magA === 0 || magB === 0) return 0;
        return dot / (magA * magB);
    }

    // Convert TF-IDF document into vector
    buildTFIDFVectors(tfidf, allTerms) {
        return Array.from({ length: tfidf.documents.length }, (_, i) => {
            return allTerms.map(term => tfidf.tfidf(term, i));
        });
    }

    async getRecommendations(userQuery) {
        if (!userQuery || !userQuery.trim()) return [];

        const data = await this.getAllBusinessWithProducts();

        // 1. Build TF-IDF
        const tfidf = new natural.TfIdf();
        const productToBusinessMap = [];
        const allTermsSet = new Set();

        data.forEach(b => {
            b.products.forEach(p => {
                const text = `${p.product_name || ''} ${p.product_description || ''}`;
                tfidf.addDocument(text);
                productToBusinessMap.push(b.business_id);

                // collect all terms for vector
                text.split(/\s+/).forEach(term => allTermsSet.add(term.toLowerCase()));
            });
        });

        const allTerms = Array.from(allTermsSet);

        // Build TF-IDF vectors
        const vectors = this.buildTFIDFVectors(tfidf, allTerms);

        // Build user query vector
        const userTerms = userQuery.split(/\s+/).map(t => t.toLowerCase());
        const queryVector = allTerms.map(term => {
            // simple TF-IDF like measure
            let tf = userTerms.filter(t => t === term).length;
            let idf = tfidf.idf(term) || 0;
            return tf * idf;
        });

        // 2. Compute cosine similarity per product
        const scores = {};
        vectors.forEach((vec, idx) => {
            const sim = this.cosineSimilarity(vec, queryVector);
            const businessId = productToBusinessMap[idx];
            if (!scores[businessId]) scores[businessId] = 0;
            scores[businessId] += sim; // sum over products
        });

        // Optional: boost by category matching (e.g., if query contains category keyword)
        data.forEach(b => {
            const businessId = b.business_id;
            if (b.business_category && userQuery.toLowerCase().includes(b.business_category.toLowerCase())) {
                scores[businessId] = (scores[businessId] || 0) + 0.5; // boost factor
            }
        });

        // 3. Rank top businesses
        const rankedBusinessIds = Object.entries(scores)
            .sort((a, b) => b[1] - a[1])
            .map(([businessId]) => businessId)
            .slice(0, 3);

        // 4. Resolve full business data
        const results = await Promise.all(
            rankedBusinessIds.map(id => this.getBussinessWithProductsById(id))
        );

        return results.filter(Boolean);
    }
}

module.exports = new AiService();
