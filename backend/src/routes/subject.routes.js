const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subject.controller');

// Thêm subject
router.post('/', (req, res) => subjectController.createSubject(req, res));

// Lấy tất cả subject (có cursor pagination)
router.get('/', (req, res) => subjectController.getAllSubjects(req, res));

// Lấy 10 subject mới nhất
router.get('/latest', (req, res) => subjectController.getLatestSubjects(req, res));

// Tìm subject theo title (?title=)
router.get('/search', (req, res) => subjectController.getSubjectsByTitle(req, res));

// Lấy subject theo category
router.get('/category/:category', (req, res) => subjectController.getSubjectsByCategory(req, res));

// Lấy subject theo id
router.get('/:id', (req, res) => subjectController.getSubjectById(req, res));

// Cập nhật subject
router.put('/:id', (req, res) => subjectController.updateSubject(req, res));

// Xóa subject
router.delete('/:id', (req, res) => subjectController.deleteSubject(req, res));

module.exports = router;
