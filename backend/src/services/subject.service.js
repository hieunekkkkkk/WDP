const Subject = require('../entity/module/subject.model');

class SubjectService {
    async createSubject(data) {
        const subject = new Subject(data);
        await subject.save();
        return subject;
    }

    async getSubjectById(id) {
        return await Subject.findById(id);
    }

    async getSubjectsByCategory(category) {
        return await Subject.find({ category });
    }

    async getAllSubjects(limit = 10, cursor = null) {
        const query = {};
        if (cursor) {
            query._id = { $lt: cursor }; // lấy các subject cũ hơn cursor
        }

        const subjects = await Subject.find(query)
            .sort({ createdAt: -1 })
            .limit(limit);

        const nextCursor = subjects.length > 0 ? subjects[subjects.length - 1]._id : null;

        return {
            subjects,
            nextCursor, // để frontend gọi tiếp
        };
    }

    async updateSubject(id, data) {
        return await Subject.findByIdAndUpdate(id, data, { new: true });
    }

    async deleteSubject(id) {
        return await Subject.findByIdAndDelete(id);
    }

    async getLatestSubjects(limit = 10) {
        try {
            const subjects = await Subject.find()
                .sort({ createdAt: -1 })
                .limit(limit);
            return subjects;
        } catch (error) {
            console.error('Error fetching latest subjects:', error);
            throw error;
        }
    }

    /**
     * Tìm subject theo tiêu đề (có hỗ trợ tìm gần đúng, không phân biệt hoa thường)
     */
    async getSubjectsByTitle(title) {
        return await Subject.find({
            title: { $regex: title, $options: 'i' },
        });
    }
}

module.exports = new SubjectService();
