const BusinessModel = require('../entity/module/business.model');
const ProductModel = require('../entity/module/product.model');
const Ollama = require("@langchain/ollama");
const GoogleGenAI = require("@langchain/google-genai");
const GOOGLE_API_KEY="AIzaSyB8QO5YLX0IkDpW9TMZ--OCsd3s9OUGHVM";
SYSTEM_PROMPT = `
Bạn là một Trợ lý AI chuyên nghiệp. Nhiệm vụ của bạn là TƯ VẤN và ĐỀ XUẤT TỐI ĐA 5 DOANH NGHIỆP (business_id) phù hợp nhất với yêu cầu của khách hàng, dựa trên DỮ LIỆU SẢN PHẨM đã được cung cấp.

⚠️ CHỈ TRẢ VỀ DANH SÁCH business_id — MỖI MÃ TRÊN MỘT DÒNG — KHÔNG KÈM THEO BẤT KỲ THÔNG TIN NÀO KHÁC.

──────────────────────────────────────
# QUY TẮC BẮT BUỘC

1. CHỈ sử dụng thông tin sản phẩm từ dữ liệu được cung cấp.
2. CHỈ trả về business_id — KHÔNG có giải thích, KHÔNG có mô tả, KHÔNG có text thừa.
3. KHÔNG tạo thêm bất kỳ nội dung gì không có trong dữ liệu.
4. KHÔNG sử dụng Markdown, HTML, dấu gạch đầu dòng, tiêu đề, hoặc ký tự đặc biệt.
5. Nếu KHÔNG có doanh nghiệp phù hợp, trả về đúng một dòng duy nhất chứa chuỗi rỗng hoặc null.

──────────────────────────────────────
# CẤU TRÚC DỮ LIỆU NHẬP VÀO

Bạn sẽ nhận được:
- Một DANH SÁCH SẢN PHẨM, mỗi sản phẩm có:
  - business_id (string): mã doanh nghiệp
  - product_id (string): mã sản phẩm
  - product_name (string): tên sản phẩm
  - product_description (string): mô tả sản phẩm
  - product_price (string | number): giá (VNĐ)

──────────────────────────────────────
# CÁCH XỬ LÝ

## 1. PHÂN TÍCH YÊU CẦU KHÁCH HÀNG
- Xác định các yếu tố chính:
  - LOẠI SẢN PHẨM hoặc MÓN MONG MUỐN (vd: trà sữa, bánh ngọt, phụ kiện, thời trang…)
  - TÍNH CHẤT MONG MUỐN (vd: cao cấp, bình dân, hữu cơ, take-away, không gian đẹp…)
  - NGÂN SÁCH hoặc KHOẢNG GIÁ ƯU TIÊN (nếu có)
  - YẾU TỐ PHỤ liên quan (vd: có topping, giao hàng, ngồi tại chỗ…)

## 2. CHẤM ĐIỂM SẢN PHẨM
- Với mỗi sản phẩm:
  - So khớp tên + mô tả với yêu cầu (tìm từ khóa chính & từ đồng nghĩa)
  - So sánh giá với ngân sách đã cho (nếu có)
  - Tính ĐỘ PHÙ HỢP (từ 0 đến 1)

## 3. CHẤM ĐIỂM DOANH NGHIỆP
- Với mỗi doanh nghiệp:
  - Tính điểm trung bình từ tất cả sản phẩm của doanh nghiệp đó
  - Nếu nhiều doanh nghiệp đồng điểm: ưu tiên doanh nghiệp có số lượng sản phẩm phù hợp cao hơn

## 4. XUẤT KẾT QUẢ
- Chọn tối đa 5 doanh nghiệp có điểm cao nhất
- Xuất business_id của họ — mỗi dòng là một mã — KHÔNG THÊM GÌ KHÁC
- Nếu không có kết quả phù hợp: trả về một dòng duy nhất là chuỗi rỗng hoặc null

──────────────────────────────────────
# LUẬT MAPPING THEO LOẠI NHU CẦU

- Nếu khách hàng hỏi “đồ uống” → chỉ lấy quán nước, quán cà phê, trà, sinh tố…
- Nếu hỏi “đồ ăn” → lấy quán ăn, nhà hàng, quán cơm…
- Nếu hỏi “đồ ăn vặt” → lấy quán ăn vặt, quán bánh, snack…
- Nếu hỏi “đồ uống có cồn” → chọn quán bar, pub, beer club…
- Nếu hỏi “đồ ăn nhanh” → chọn fast food, burger, pizza…
- Nếu hỏi “nhà hàng” → chọn nhà hàng, không lấy quán ăn bình thường

──────────────────────────────────────
# ĐỊNH DẠNG ĐẦU RA BẮT BUỘC

✅ ĐÚNG:
6874bef6413e817b336a2ffd  
6874c1ef413e817b336a300a  
6874c1e1413e817b336a3009  

❌ SAI:
- Không được có chữ, dấu gạch, Markdown
- Không có tiêu đề, ký tự “-” hoặc “1.”, “2.”…
- Không có giải thích, lý do, hoặc mô tả thêm

──────────────────────────────────────
# TRƯỜNG HỢP ĐẶC BIỆT

- Nếu KHÔNG tìm thấy DOANH NGHIỆP nào phù hợp → Trả về DUY NHẤT một dòng: chuỗi rỗng hoặc null

──────────────────────────────────────
# VÍ DỤ

■ Yêu cầu khách hàng:  
“Tôi muốn quán cà phê sạch, view đẹp, giá cà phê dưới 60.000 VNĐ”

■ Đầu ra (giả định):
6874bef6413e817b336a2ffd  
6874c1ef413e817b336a300a  
6874c1e1413e817b336a3009

──────────────────────────────────────
# NGUYÊN TẮC KHÁC

- LUÔN LUÔN phải trả ra đúng định dạng đầu ra
- KHÔNG GÌ là tốt hơn cả việc tuân thủ quy tắc
- Nếu có thể hiểu gần đúng yêu cầu, vẫn phải trả về kết quả gần sát nhất có thể

`
function extractRecommendation(responseText) {
    const thinkTagEnd = responseText.indexOf("</think>");
    if (thinkTagEnd !== -1) {
        return responseText.slice(thinkTagEnd + "</think>".length).trim();
    } else {
        // Fallback nếu không tìm thấy tag
        return responseText.trim();
    }
}

class AiService {
    // Helper method to get all businesses
    async getAllBusinesses() {
        try {
            return await BusinessModel.find().lean().populate('business_category_id'); // Use .lean() for plain JS objects
        } catch (error) {
            throw new Error(`Error fetching businesses: ${error.message}`);
        }
    }

    // Helper method to get all products
    async getAllProducts() {
        try {
            return await ProductModel.find().lean();
        } catch (error) {
            throw new Error(`Error fetching products: ${error.message}`);
        }
    }

    // Main method to get businesses with their products
    async getAllBusinessWithProducts() {
        try {
            const businesses = await this.getAllBusinesses();
            const products = await this.getAllProducts();

            return businesses.map(business => ({
                "business_id": business._id,
                "business_name": business.business_name,
                "business_address": business.business_address,
                "business_detail": business.business_detail,
                "business_status": business.business_status,
                "business_image": business.business_image,
                "business_category": business.business_category_id.category_name,
                "products": products.filter(product =>
                    product.business_id.toString() === business._id.toString()
                ).map(product => ({
                    "product_id": product._id,
                    "product_name": product.product_name,
                    "product_description": product.product_description,
                    "product_price": product.product_price
                }))
            }));
        } catch (error) {
            throw new Error(`Error fetching businesses with products: ${error.message}`);
        }
    }

    async getBussinessWithProductsById(businessId) {
        try {
            const business = await BusinessModel.findById(businessId).lean().populate('business_category_id');
            if (!business) {
                throw new Error(`Business with ID ${businessId} not found`);
            }
            const products = await ProductModel.find({ business_id: businessId }).lean();
            return {
                "business_id": business._id,
                "business_name": business.business_name,
                "business_address": business.business_address,
                "business_detail": business.business_detail,
                "business_status": business.business_status,
                "business_image": business.business_image,
                "business_category": business.business_category_id.category_name,
                "products": products.map(product => ({
                    "product_id": product._id,
                    "product_name": product.product_name,
                    "product_description": product.product_description,
                    "product_price": product.product_price
                })),
            };
        } catch (error) {
            throw new Error(`Error fetching business with products by ID ${businessId}: ${error.message}`);
        }
    }


    async getRecommendations(text) {
        try {
            // const isConnected = await this.checkOllamaConnection();
            // if (!isConnected) {
            //     throw new Error("Không thể kết nối tới Ollama server");
            // }
            const data = await this.getAllBusinessWithProducts();
            const products = data.flatMap(business =>
                business.products.map(product => ({
                    business_id: business.business_id.toString(),
                    product_id: product.product_id.toString(),
                    product_name: product.product_name,
                    product_description: product.product_description,
                    product_price: product.product_price
                }))
            );
            
            const model = new GoogleGenAI.ChatGoogleGenerativeAI({
                model: "gemini-1.5-flash",
                apiKey: GOOGLE_API_KEY.toString(),
                temperature: 0.01,
                maxOutputTokens: 1000,
                topP: 0.9,
                topK: 20,
            });
            // const model = new Ollama.ChatOllama({
            //     model: "deepseek-r1:1.5b",
            //     temperature: 0.01,
            //     maxTokens: 1000,
            //     topP: 0.9,
            //     topK: 20
            // });
            
            const response = await model.invoke([
                {
                    role: "system",
                    content: SYSTEM_PROMPT + `\n\n Dưới đây là danh sách sản phẩm:\n${JSON.stringify(products, null, 2)}`
                },
                {
                    role: "user",
                    content: `Yêu cầu của khách hàng: ${text}`
                }
            ]);
            // Here you would typically call an AI service or model to get recommendations based on the text input.            
            //Fill service AI in here
            // console.log(JSON.stringify(products, null, 2));
            console.log("Response from AI model:", response);
            const recommendations = response.content;
            console.log("Recommendations:", recommendations);
            const final_recommendations = extractRecommendation(recommendations).split('\n');
            // console.log("Recommendations:", final_recommendations);
            const results = await Promise.all(
                final_recommendations.map(id => this.getBussinessWithProductsById(id))
            );

            return results;
        }
        catch (error) {
            throw new Error(`Error getting recommendations: ${error.message}`);
        }
    }
}

module.exports = new AiService();