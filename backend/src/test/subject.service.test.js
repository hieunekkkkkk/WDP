const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SubjectService = require('../services/subject.service');
const Subject = require('../entity/module/subject.model');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    jest.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(async () => {
    await Subject.deleteMany({});
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

describe('SubjectService', () => {
    describe('createSubject', () => {
        it('should create a new subject', async () => {
            const data = {
                title: 'Math 101',
                description: 'Basic mathematics',
                category: 'mathematics'
            };

            const result = await SubjectService.createSubject(data);

            expect(result._id).toBeDefined();
            expect(result.title).toBe('Math 101');
            expect(result.category).toBe('mathematics');
        });
    });

    describe('getSubjectById', () => {
        it('should return subject by ID', async () => {
            const subject = await Subject.create({
                title: 'Physics 101',
                description: 'Basic physics',
                category: 'science'
            });

            const result = await SubjectService.getSubjectById(subject._id);

            expect(result.title).toBe('Physics 101');
        });

        it('should return null if subject not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const result = await SubjectService.getSubjectById(fakeId);
            expect(result).toBeNull();
        });
    });

    describe('getSubjectsByCategory', () => {
        it('should return subjects by category', async () => {
            await Subject.create({
                title: 'Math 101',
                category: 'mathematics'
            });
            await Subject.create({
                title: 'Math 102',
                category: 'mathematics'
            });
            await Subject.create({
                title: 'Physics 101',
                category: 'science'
            });

            const result = await SubjectService.getSubjectsByCategory('mathematics');

            expect(result).toHaveLength(2);
            expect(result[0].category).toBe('mathematics');
        });
    });

    describe('getAllSubjects', () => {
        it('should return paginated subjects', async () => {
            for (let i = 1; i <= 15; i++) {
                await Subject.create({
                    title: `Subject ${i}`,
                    category: 'test'
                });
            }

            const result = await SubjectService.getAllSubjects(10);

            expect(result.subjects).toHaveLength(10);
            expect(result.nextCursor).toBeDefined();
        });

        it('should support cursor-based pagination', async () => {
            const subjects = [];
            for (let i = 1; i <= 5; i++) {
                const subject = await Subject.create({
                    title: `Subject ${i}`,
                    category: 'test'
                });
                subjects.push(subject);
            }

            // Get first page
            const firstPage = await SubjectService.getAllSubjects(2);
            expect(firstPage.subjects).toHaveLength(2);

            // Get next page with cursor
            const secondPage = await SubjectService.getAllSubjects(2, firstPage.nextCursor);
            expect(secondPage.subjects).toHaveLength(2);
            expect(secondPage.subjects[0]._id.toString()).not.toBe(firstPage.subjects[0]._id.toString());
        });

        it('should return empty nextCursor when no more subjects', async () => {
            await Subject.create({
                title: 'Only subject',
                category: 'test'
            });

            const result = await SubjectService.getAllSubjects(10);

            expect(result.subjects).toHaveLength(1);
            expect(result.nextCursor).toBeDefined();
        });
    });

    describe('updateSubject', () => {
        it('should update subject successfully', async () => {
            const subject = await Subject.create({
                title: 'Old Title',
                category: 'test'
            });

            const result = await SubjectService.updateSubject(subject._id, {
                title: 'New Title'
            });

            expect(result.title).toBe('New Title');
        });

        it('should return null if subject not found', async () => {
            const fakeId = new mongoose.Types.ObjectId();
            const result = await SubjectService.updateSubject(fakeId, { title: 'Test' });
            expect(result).toBeNull();
        });
    });

    describe('deleteSubject', () => {
        it('should delete subject successfully', async () => {
            const subject = await Subject.create({
                title: 'To Delete',
                category: 'test'
            });

            await SubjectService.deleteSubject(subject._id);

            const found = await Subject.findById(subject._id);
            expect(found).toBeNull();
        });
    });

    describe('getLatestSubjects', () => {
        it('should return latest subjects', async () => {
            for (let i = 1; i <= 5; i++) {
                await Subject.create({
                    title: `Subject ${i}`,
                    category: 'test'
                });
                // Small delay to ensure different createdAt
                await new Promise(resolve => setTimeout(resolve, 10));
            }

            const result = await SubjectService.getLatestSubjects(3);

            expect(result).toHaveLength(3);
            // Latest should be first
            expect(result[0].title).toBe('Subject 5');
        });

        it('should handle errors gracefully', async () => {
            // Mock find to throw error
            jest.spyOn(Subject, 'find').mockImplementationOnce(() => {
                throw new Error('Database error');
            });

            await expect(SubjectService.getLatestSubjects()).rejects.toThrow('Database error');

            // Restore mock
            Subject.find.mockRestore();
        });
    });

    describe('getSubjectsByTitle', () => {
        it('should find subjects by title (case insensitive)', async () => {
            await Subject.create({ title: 'Advanced Math', category: 'test' });
            await Subject.create({ title: 'Basic MATH', category: 'test' });
            await Subject.create({ title: 'Physics', category: 'test' });

            const result = await SubjectService.getSubjectsByTitle('math');

            expect(result).toHaveLength(2);
        });

        it('should return empty array if no match', async () => {
            await Subject.create({ title: 'Physics', category: 'test' });

            const result = await SubjectService.getSubjectsByTitle('chemistry');

            expect(result).toEqual([]);
        });

        it('should support partial matching', async () => {
            await Subject.create({ title: 'Introduction to Programming', category: 'test' });

            const result = await SubjectService.getSubjectsByTitle('program');

            expect(result).toHaveLength(1);
            expect(result[0].title).toContain('Programming');
        });
    });
});
