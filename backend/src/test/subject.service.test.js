const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const SubjectService = require('../services/subject.service');
const Subject = require('../entity/module/subject.model');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Subject.deleteMany();
});

describe('SubjectService', () => {
  const mockSubject = {
    title: 'Intro to Node.js',
    description: 'Learn Node.js basics',
    author: 'Vinh Le',
    category: 'Programming',
    driveUrl: 'https://drive.google.com/node',
  };

  // CREATE
  describe('createSubject', () => {
    it('should create a new subject successfully', async () => {
      const result = await SubjectService.createSubject(mockSubject);
      expect(result).toHaveProperty('_id');
      expect(result.title).toBe(mockSubject.title);
    });

    it('should allow numeric title (auto-cast to string)', async () => {
      const result = await SubjectService.createSubject({ title: 123 });
      expect(result.title).toBe('123');
    });

    it('should throw error if save() fails', async () => {
      jest.spyOn(Subject.prototype, 'save').mockRejectedValueOnce(new Error('DB Error'));
      await expect(SubjectService.createSubject(mockSubject)).rejects.toThrow('DB Error');
      jest.restoreAllMocks();
    });
  });

  // GET BY ID
  describe('getSubjectById', () => {
    it('should return subject by id', async () => {
      const created = await SubjectService.createSubject(mockSubject);
      const found = await SubjectService.getSubjectById(created._id);
      expect(found.title).toBe(mockSubject.title);
    });

    it('should return null if not found', async () => {
      const res = await SubjectService.getSubjectById(new mongoose.Types.ObjectId());
      expect(res).toBeNull();
    });
  });

  // GET BY CATEGORY
  describe('getSubjectsByCategory', () => {
    it('should get subjects in the same category', async () => {
      await SubjectService.createSubject(mockSubject);
      const result = await SubjectService.getSubjectsByCategory('Programming');
      expect(result.length).toBe(1);
    });

    it('should return empty array if no match', async () => {
      const result = await SubjectService.getSubjectsByCategory('Math');
      expect(result).toEqual([]);
    });
  });

  // GET ALL
  describe('getAllSubjects', () => {
    it('should return paginated subjects', async () => {
      for (let i = 0; i < 5; i++) await SubjectService.createSubject({ ...mockSubject, title: `Subject ${i}` });
      const res = await SubjectService.getAllSubjects(3);
      expect(res.subjects.length).toBe(3);
      expect(res).toHaveProperty('nextCursor');
    });

    it('should return remaining subjects when cursor is used', async () => {
      const all = [];
      for (let i = 0; i < 5; i++) all.push(await SubjectService.createSubject({ ...mockSubject, title: `S${i}` }));
      const { subjects, nextCursor } = await SubjectService.getAllSubjects(3);
      const next = await SubjectService.getAllSubjects(3, nextCursor);
      expect(next.subjects.length).toBeLessThanOrEqual(2);
    });
  });

  // UPDATE
  describe('updateSubject', () => {
    it('should update a subject successfully', async () => {
      const created = await SubjectService.createSubject(mockSubject);
      const updated = await SubjectService.updateSubject(created._id, { title: 'Updated Title' });
      expect(updated.title).toBe('Updated Title');
    });

    it('should return null if subject not found', async () => {
      const result = await SubjectService.updateSubject(new mongoose.Types.ObjectId(), { title: 'Nothing' });
      expect(result).toBeNull();
    });
  });

  // DELETE
  describe('deleteSubject', () => {
    it('should delete a subject by id', async () => {
      const created = await SubjectService.createSubject(mockSubject);
      const deleted = await SubjectService.deleteSubject(created._id);
      expect(deleted._id.toString()).toBe(created._id.toString());
    });

    it('should return null if subject not found', async () => {
      const result = await SubjectService.deleteSubject(new mongoose.Types.ObjectId());
      expect(result).toBeNull();
    });
  });

  // GET LATEST
  describe('getLatestSubjects', () => {
    it('should return latest subjects sorted by createdAt', async () => {
      await SubjectService.createSubject(mockSubject);
      await SubjectService.createSubject({ ...mockSubject, title: 'Later One' });
      const result = await SubjectService.getLatestSubjects(2);
      expect(result[0].createdAt >= result[1].createdAt).toBe(true);
    });

    it('should throw error if query fails', async () => {
      jest.spyOn(Subject, 'find').mockImplementationOnce(() => ({
        sort: () => ({
          limit: () => {
            throw new Error('DB Error');
          },
        }),
      }));
      await expect(SubjectService.getLatestSubjects()).rejects.toThrow('DB Error');
      jest.restoreAllMocks();
    });
  });

  // SEARCH BY TITLE
  describe('getSubjectsByTitle', () => {
    it('should find subjects by title (case insensitive)', async () => {
      await SubjectService.createSubject(mockSubject);
      const result = await SubjectService.getSubjectsByTitle('node');
      expect(result.length).toBe(1);
    });

    it('should return empty array if no title matches', async () => {
      const result = await SubjectService.getSubjectsByTitle('React');
      expect(result).toEqual([]);
    });
  });
});
