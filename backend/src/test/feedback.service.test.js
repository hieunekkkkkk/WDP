const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const FeedbackService = require('../services/feedback.service');
const Feedback = require('../entity/module/feedback.model');

mongoose.model('business', new mongoose.Schema({ business_name: String }));
mongoose.model('product', new mongoose.Schema({ product_name: String }));
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Feedback.deleteMany();
});

// Mock populate to avoid schema registration errors
jest.spyOn(Feedback.prototype, 'populate').mockImplementation(function () {
  return this;
});

describe('FeedbackService', () => {
  const sampleFeedback = {
    user_id: 'user123',
    business_id: new mongoose.Types.ObjectId(),
    feedback_type: 'business',
    feedback_comment: 'Great place!',
    feedback_rating: 5,
    feedback_like: 0,
    feedback_dislike: 0,
  };

  // -------------------- CREATE --------------------
  describe('createFeedback', () => {
    it('should create a new feedback successfully', async () => {
      const result = await FeedbackService.createFeedback(sampleFeedback);
      expect(result).toHaveProperty('_id');
      expect(result.feedback_comment).toBe('Great place!');
    });

    it('should not throw when empty data (schema allows it)', async () => {
      const result = await FeedbackService.createFeedback({});
      expect(result).toHaveProperty('_id');
      expect(result.feedback_status).toBeDefined();
    });

    it('should convert business_id to ObjectId', async () => {
      const feedbackData = { ...sampleFeedback, business_id: String(new mongoose.Types.ObjectId()) };
      const result = await FeedbackService.createFeedback(feedbackData);
      expect(result.business_id).toBeInstanceOf(mongoose.Types.ObjectId);
    });
  });

  // -------------------- GET ALL --------------------
  describe('getAllFeedbacks', () => {
    it('should return empty array when no feedbacks exist', async () => {
      const result = await FeedbackService.getAllFeedbacks();
      expect(result).toEqual([]);
    });

    it('should return all feedbacks', async () => {
      await Feedback.create(sampleFeedback);
      const result = await FeedbackService.getAllFeedbacks();
      expect(result.length).toBe(1);
      expect(result[0].feedback_comment).toBe('Great place!');
    });
  });

  // -------------------- GET BY ID --------------------
  describe('getFeedbackById', () => {
    it('should get feedback by ID', async () => {
      const fb = await Feedback.create(sampleFeedback);
      const result = await FeedbackService.getFeedbackById(fb._id);
      expect(result.feedback_comment).toBe('Great place!');
    });

    it('should throw when ID invalid', async () => {
      await expect(FeedbackService.getFeedbackById('123')).rejects.toThrow(/Invalid feedback ID/);
    });

    it('should throw when not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(FeedbackService.getFeedbackById(fakeId)).rejects.toThrow(/Feedback not found/);
    });
  });

  // -------------------- FIND BY BUSINESS --------------------
  describe('findFeedbackByBusinessId', () => {
    it('should return feedbacks by business ID', async () => {
      const fb = await Feedback.create(sampleFeedback);
      const result = await FeedbackService.findFeedbackByBusinessId(fb.business_id);
      expect(result.length).toBe(1);
    });

    it('should return empty array when none found', async () => {
      const result = await FeedbackService.findFeedbackByBusinessId(new mongoose.Types.ObjectId());
      expect(result).toEqual([]);
    });
  });

  // -------------------- FIND BY PRODUCT --------------------
  describe('findFeedbackByProductId', () => {
    it('should return feedbacks by product ID', async () => {
      const productFeedback = await Feedback.create({
        ...sampleFeedback,
        feedback_type: 'product',
        product_id: new mongoose.Types.ObjectId(),
      });
      const result = await FeedbackService.findFeedbackByProductId(productFeedback.product_id);
      expect(result.length).toBe(1);
    });

    it('should return empty array when none found', async () => {
      const result = await FeedbackService.findFeedbackByProductId(new mongoose.Types.ObjectId());
      expect(result).toEqual([]);
    });
  });

  // -------------------- UPDATE --------------------
  describe('updateFeedback', () => {
    it('should update feedback comment successfully', async () => {
      const fb = await Feedback.create(sampleFeedback);
      const updated = await FeedbackService.updateFeedback(fb._id, { feedback_comment: 'Updated!' });
      expect(updated.feedback_comment).toBe('Updated!');
    });

    it('should throw if invalid ID', async () => {
      await expect(FeedbackService.updateFeedback('123', {})).rejects.toThrow(/Invalid feedback ID/);
    });

    it('should throw if feedback not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(FeedbackService.updateFeedback(fakeId, { feedback_comment: 'x' }))
        .rejects.toThrow(/Feedback not found/);
    });
  });

  // -------------------- DELETE --------------------
  describe('deleteFeedback', () => {
    it('should delete feedback successfully', async () => {
      const fb = await Feedback.create(sampleFeedback);
      const result = await FeedbackService.deleteFeedback(fb._id);
      expect(result._id.toString()).toBe(fb._id.toString());
    });

    it('should throw if invalid ID', async () => {
      await expect(FeedbackService.deleteFeedback('123')).rejects.toThrow(/Invalid feedback ID/);
    });

    it('should throw if not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(FeedbackService.deleteFeedback(fakeId)).rejects.toThrow(/Feedback not found/);
    });
  });

  // -------------------- INCREMENT LIKE --------------------
  describe('incrementLike', () => {
    it('should increase feedback_like by 1', async () => {
      const fb = await Feedback.create({ ...sampleFeedback, feedback_like: 2 });
      const updated = await FeedbackService.incrementLike(fb._id);
      expect(updated.feedback_like).toBe(3);
    });

    it('should throw if invalid ID', async () => {
      await expect(FeedbackService.incrementLike('123')).rejects.toThrow(/Invalid feedback ID/);
    });

    it('should throw if not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(FeedbackService.incrementLike(fakeId)).rejects.toThrow(/Feedback not found/);
    });
  });

  // -------------------- INCREMENT DISLIKE --------------------
  describe('incrementDislike', () => {
    it('should increase feedback_dislike by 1', async () => {
      const fb = await Feedback.create({ ...sampleFeedback, feedback_dislike: 1 });
      const updated = await FeedbackService.incrementDislike(fb._id);
      expect(updated.feedback_dislike).toBe(2);
    });

    it('should throw if invalid ID', async () => {
      await expect(FeedbackService.incrementDislike('123')).rejects.toThrow(/Invalid feedback ID/);
    });

    it('should throw if not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(FeedbackService.incrementDislike(fakeId)).rejects.toThrow(/Feedback not found/);
    });
  });

  // -------------------- UPDATE RESPONSE --------------------
  describe('updateFeedbackResponse', () => {
    it('should update feedback response successfully', async () => {
      const fb = await Feedback.create(sampleFeedback);
      const updated = await FeedbackService.updateFeedbackResponse(fb._id, 'Thank you!');
      expect(updated.feedback_response).toBe('Thank you!');
    });

    it('should throw if invalid ID', async () => {
      await expect(FeedbackService.updateFeedbackResponse('123', 'ok')).rejects.toThrow(/Invalid feedback ID/);
    });

    it('should throw if feedback not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await expect(FeedbackService.updateFeedbackResponse(fakeId, 'ok')).rejects.toThrow(/Feedback not found/);
    });
  });
});
