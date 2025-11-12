import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_BE_URL}/api/subject`;

/**
 *
 * POST /api/subject
 */
export async function createSubject(data) {
  const res = await axios.post(BASE_URL, data);
  return res.data;
}

/**
 *
 * GET /api/subject?limit=10&cursor=...
 */
export async function getAllSubjects(limit = 20, cursor = null) {
  const params = {};
  if (limit) params.limit = limit;
  if (cursor) params.cursor = cursor;
  const res = await axios.get(BASE_URL, { params });
  return res.data;
}

/**
 *
 * GET /api/subject/:id
 */
export async function getSubjectById(id) {
  const res = await axios.get(`${BASE_URL}/${id}`);
  return res.data;
}

/**
 *
 * GET /api/subject/category/:category
 */
export async function getSubjectsByCategory(category) {
  const res = await axios.get(`${BASE_URL}/category/${category}`);
  return res.data;
}

/**
 *
 * GET /api/subject/latest?limit=10
 */
export async function getLatestSubjects(limit = 10) {
  const res = await axios.get(`${BASE_URL}/latest`, { params: { limit } });
  return res.data;
}

/**
 *
 * GET /api/subject/search?title=...
 */
export async function getSubjectsByTitle(title) {
  const res = await axios.get(`${BASE_URL}/search`, {
    params: { title },
  });
  return res.data;
}

/**
 *
 * PUT /api/subject/:id
 */
export async function updateSubject(id, data) {
  const res = await axios.put(`${BASE_URL}/${id}`, data);
  return res.data;
}

/**
 *
 * DELETE /api/subject/:id
 */
export async function deleteSubject(id) {
  const res = await axios.delete(`${BASE_URL}/${id}`);
  return res.data;
}
