/* eslint-disable no-unreachable */
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export const gemini = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function askGemini(prompt) {
  try {
    const result = await gemini.generateContent(prompt);
    return result.response.text();
    console.log("Gemini response:", result.response.text());
  } catch (error) {
    console.error("Gemini API error:", error);
    return "❌ Không thể kết nối tới AI. Vui lòng thử lại sau.";
  }
}
