require('dotenv').config({ path: '.env.dev' });
const mongoose = require('mongoose');
const PaymentService = require('../services/payment.service');
const Payment = require('../entity/module/payment.model');
const Stack = require('../entity/module/stack.model');
const payOS = require('../utils/payos');

// 🧩 Mock các module phụ thuộc
jest.mock('../entity/module/payment.model');
jest.mock('../entity/module/stack.model');
jest.mock('../utils/payos');

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // === CREATE PAYMENT ===
  describe('createPayment', () => {
    it('should throw error if stack_id is missing', async () => {
      await expect(PaymentService.createPayment(null, 'user1'))
        .rejects
        .toThrow('Stack ID is required');
    });

    it('should throw error if stack not found', async () => {
      Stack.findById.mockResolvedValue(null);
      await expect(PaymentService.createPayment('invalid', 'user1'))
        .rejects
        .toThrow('Stack not found');
    });

    it('should throw error if payOS link creation fails', async () => {
      const fakeStack = { _id: 'stack1', stack_price: 100, stack_name: 'Premium' };
      Stack.findById.mockResolvedValue(fakeStack);
      payOS.createPaymentLink.mockRejectedValue(new Error('PayOS Error'));

      await expect(PaymentService.createPayment('stack1', 'user1'))
        .rejects
        .toThrow('PayOS Error');
    });

    it('should create a payment successfully', async () => {
      const fakeStack = { _id: 'stack1', stack_price: 100, stack_name: 'Premium' };
      const fakeResponse = { checkoutUrl: 'https://checkout.payos.com/123' };

      Stack.findById.mockResolvedValue(fakeStack);
      Payment.prototype.save = jest.fn().mockResolvedValue({});
      payOS.createPaymentLink.mockResolvedValue(fakeResponse);

      const result = await PaymentService.createPayment('stack1', 'user1');

      expect(Stack.findById).toHaveBeenCalledWith('stack1');
      expect(payOS.createPaymentLink).toHaveBeenCalled();
      expect(Payment.prototype.save).toHaveBeenCalled();
      expect(result.url).toBe(fakeResponse.checkoutUrl);
      expect(result.message).toBe('Payment created');
    });
  });

  // === HANDLE CALLBACK ===
  describe('handlePaymentCallback', () => {
    it('should update payment status to completed when status is PAID', async () => {
      const mockPayment = { payment_status: 'pending', save: jest.fn() };
      Payment.findOne.mockResolvedValue(mockPayment);

      const result = await PaymentService.handlePaymentCallback('12345', 'PAID');
      expect(mockPayment.payment_status).toBe('completed');
      expect(mockPayment.save).toHaveBeenCalled();
      expect(result.message).toBe('Payment status updated successfully');
    });

    it('should update payment status to failed when status is FAILED', async () => {
      const mockPayment = { payment_status: 'pending', save: jest.fn() };
      Payment.findOne.mockResolvedValue(mockPayment);

      const result = await PaymentService.handlePaymentCallback('12345', 'FAILED');
      expect(mockPayment.payment_status).toBe('failed');
      expect(mockPayment.save).toHaveBeenCalled();
      expect(result.message).toBe('Payment status updated successfully');
    });

    it('should throw error if payment not found', async () => {
      Payment.findOne.mockResolvedValue(null);
      await expect(PaymentService.handlePaymentCallback('999', 'PAID'))
        .rejects
        .toThrow('Payment not found');
    });
  });

  // === GET PAYMENT BY ID ===
  describe('getPaymentById', () => {
    it('should throw if invalid ID', async () => {
      await expect(PaymentService.getPaymentById('invalid'))
        .rejects
        .toThrow('Invalid payment ID');
    });

    it('should throw if payment not found', async () => {
      Payment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await expect(PaymentService.getPaymentById(new mongoose.Types.ObjectId().toString()))
        .rejects
        .toThrow('Payment not found');
    });

    it('should return payment if found', async () => {
      const mockPayment = { _id: '507f1f77bcf86cd799439011' };
      Payment.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockPayment),
      });

      const result = await PaymentService.getPaymentById('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockPayment);
    });
  });

  // === UPDATE PAYMENT ===
  describe('updatePayment', () => {
    it('should update payment successfully', async () => {
      const mockPayment = { _id: '1', payment_status: 'completed' };
      Payment.findByIdAndUpdate.mockResolvedValue(mockPayment);

      const result = await PaymentService.updatePayment('507f1f77bcf86cd799439011', { payment_status: 'completed' });
      expect(result).toEqual(mockPayment);
    });

    it('should throw error if payment not found', async () => {
      Payment.findByIdAndUpdate.mockResolvedValue(null);
      await expect(PaymentService.updatePayment('507f1f77bcf86cd799439011', {}))
        .rejects
        .toThrow('Payment not found');
    });

    it('should throw on DB error', async () => {
      Payment.findByIdAndUpdate.mockRejectedValue(new Error('DB Error'));
      await expect(PaymentService.updatePayment('507f1f77bcf86cd799439011', {}))
        .rejects
        .toThrow('DB Error');
    });
  });

  // === DELETE PAYMENT ===
  describe('deletePayment', () => {
    it('should delete payment successfully', async () => {
      const mockPayment = { _id: '1' };
      Payment.findByIdAndDelete.mockResolvedValue(mockPayment);

      const result = await PaymentService.deletePayment('507f1f77bcf86cd799439011');
      expect(result).toEqual(mockPayment);
    });

    it('should throw error if not found', async () => {
      Payment.findByIdAndDelete.mockResolvedValue(null);
      await expect(PaymentService.deletePayment('507f1f77bcf86cd799439011'))
        .rejects
        .toThrow('Payment not found');
    });

    it('should throw error on DB failure', async () => {
      Payment.findByIdAndDelete.mockRejectedValue(new Error('DB Error'));
      await expect(PaymentService.deletePayment('507f1f77bcf86cd799439011'))
        .rejects
        .toThrow('DB Error');
    });
  });

  // === SEARCH PAYMENTS ===
  describe('searchPaymentsByUserId', () => {
    it('should return list of payments by user', async () => {
      const mockPayments = [{ user_id: 'user1', payment_amount: 100 }];
      Payment.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue(mockPayments),
        }),
      });

      const result = await PaymentService.searchPaymentsByUserId('user1');
      expect(result).toEqual(mockPayments);
    });

    it('should return empty array if user has no payments', async () => {
      Payment.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await PaymentService.searchPaymentsByUserId('userX');
      expect(result).toEqual([]);
    });

    it('should throw on DB error', async () => {
      Payment.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockRejectedValue(new Error('DB Error')),
        }),
      });

      await expect(PaymentService.searchPaymentsByUserId('user1'))
        .rejects
        .toThrow('DB Error');
    });
  });
});
