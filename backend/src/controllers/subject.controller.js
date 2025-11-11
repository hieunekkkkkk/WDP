const SubjectService = require('../services/subject.service');

class SubjectController {
    // POST /subjects
    async createSubject(req, res) {
        try {
            const subject = await SubjectService.createSubject(req.body);
            res.status(201).json(subject);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // GET /subjects/:id
    async getSubjectById(req, res) {
        try {
            const subject = await SubjectService.getSubjectById(req.params.id);
            if (!subject) {
                return res.status(404).json({ message: 'Subject not found' });
            }
            res.json(subject);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // GET /subjects/category/:category
    async getSubjectsByCategory(req, res) {
        try {
            const subjects = await SubjectService.getSubjectsByCategory(req.params.category);
            res.json(subjects);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // GET /subjects
    async getAllSubjects(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const cursor = req.query.cursor || null;
            const result = await SubjectService.getAllSubjects(limit, cursor);
            res.json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // PUT /subjects/:id
    async updateSubject(req, res) {
        try {
            const subject = await SubjectService.updateSubject(req.params.id, req.body);
            if (!subject) {
                return res.status(404).json({ message: 'Subject not found' });
            }
            res.json(subject);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // DELETE /subjects/:id
    async deleteSubject(req, res) {
        try {
            const subject = await SubjectService.deleteSubject(req.params.id);
            if (!subject) {
                return res.status(404).json({ message: 'Subject not found' });
            }
            res.json(subject);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // GET /subjects/latest
    async getLatestSubjects(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const subjects = await SubjectService.getLatestSubjects(limit);
            res.json(subjects);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
    // GET /subjects/title/:title
    async getSubjectsByTitle(req, res) {
        try {
            const subjects = await SubjectService.getSubjectsByTitle(req.query.title);
            res.json(subjects);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = new SubjectController();