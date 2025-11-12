import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BE_URL || "http://localhost:3000";

/**
 * Subject API Service — version optimized for backend pagination & filtering
 */
class SubjectAPI {
  /** Lấy tất cả subject có hỗ trợ cursor pagination */
  static async getAllSubjects(limit = 10, cursor = null) {
    try {
      const params = { limit };
      if (cursor) params.cursor = cursor;
      const res = await axios.get(`${API_BASE_URL}/api/subject`, { params });
      return res.data;
    } catch (error) {
      console.error("Error fetching all subjects:", error);
      throw error;
    }
  }

  /** Lấy subject mới nhất */
  static async getLatestSubjects(limit = 10) {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/subject/latest`, {
        params: { limit },
      });
      return res.data;
    } catch (error) {
      console.error("Error fetching latest subjects:", error);
      throw error;
    }
  }

  /** Lấy subject theo category */
  static async getByCategory(category) {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/subject/category/${category}`
      );
      return res.data;
    } catch (error) {
      console.error(`Error fetching subjects by category ${category}:`, error);
      throw error;
    }
  }

  /** Tìm kiếm theo tiêu đề */
  static async searchByTitle(title) {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/subject/search`, {
        params: { title },
      });
      return res.data;
    } catch (error) {
      console.error("Error searching subjects:", error);
      throw error;
    }
  }
}

/** Helper chuyển đổi dữ liệu giữa backend và frontend */
export const DataTransformer = {
  toFrontend(subject) {
    return {
      id: subject._id,
      title: subject.title,
      desc: subject.description,
      author: subject.author,
      date: subject.date
        ? new Date(subject.date).toLocaleDateString("vi-VN")
        : "",
      industry: subject.category,
      used: subject.used,
      driveUrl: subject.driveUrl,
    };
  },

  toFrontendArray(subjects) {
    return subjects.map((s) => this.toFrontend(s));
  },
};

export default SubjectAPI;
