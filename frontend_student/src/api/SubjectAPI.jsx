import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BE_URL || "http://localhost:3000";

/**
 * Subject API Service
 * Tất cả API calls liên quan đến Subject/Document management
 */
class SubjectAPI {
  static async getAllSubjects(limit = 100, cursor = null) {
    try {
      const params = { limit };
      if (cursor) params.cursor = cursor;

      const response = await axios.get(`${API_BASE_URL}/api/subject`, {
        params,
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching all subjects:", error);
      throw error;
    }
  }

  static async getLatestSubjects(limit = 10) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/subject/latest`, {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching latest subjects:", error);
      throw error;
    }
  }

  static async searchByTitle(title) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/subject/search`, {
        params: { title },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching subjects:", error);
      throw error;
    }
  }

  static async getByCategory(category) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/subject/category/${category}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error fetching subjects by category ${category}:`, error);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/subject/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching subject ${id}:`, error);
      throw error;
    }
  }

  static async getByMultipleCategories(categories) {
    try {
      if (!categories || categories.length === 0) {
        return await this.getAllSubjects(100);
      }
      const promises = categories.map((cat) => this.getByCategory(cat));
      const results = await Promise.all(promises);

      const allSubjects = results.flat();
      const uniqueSubjects = Array.from(
        new Map(allSubjects.map((s) => [s._id, s])).values()
      );

      return uniqueSubjects;
    } catch (error) {
      console.error("Error fetching subjects by multiple categories:", error);
      throw error;
    }
  }

  static async filterSubjects({ search = "", categories = [], used = null }) {
    try {
      // Lấy tất cả subjects trước
      let subjects = [];

      if (categories.length > 0) {
        subjects = await this.getByMultipleCategories(categories);
      } else {
        const response = await this.getAllSubjects(100);
        subjects = response.subjects || [];
      }

      // Client-side filtering
      let filtered = subjects;

      // Filter by search query (title, description, author)
      if (search.trim()) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (s) =>
            s.title?.toLowerCase().includes(query) ||
            s.description?.toLowerCase().includes(query) ||
            s.author?.toLowerCase().includes(query)
        );
      }

      // Filter by used field
      if (used !== null) {
        filtered = filtered.filter((s) => s.used === used);
      }

      return filtered;
    } catch (error) {
      console.error("Error filtering subjects:", error);
      throw error;
    }
  }
}

/**
 * Helper functions để transform data giữa FE và BE
 */
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
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt,
    };
  },

  toBackend(doc) {
    return {
      title: doc.title,
      description: doc.desc,
      author: doc.author,
      date: doc.date,
      category: doc.industry,
      used: doc.used,
      driveUrl: doc.driveUrl,
    };
  },

  toFrontendArray(subjects) {
    return subjects.map((s) => this.toFrontend(s));
  },
};

export default SubjectAPI;
