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

  describe('createPayment', () => {
    it('should throw error if stack_id is missing', async () => {
      await expect(PaymentService.createPayment(null, 'user1'))
        .rejects
        .toThrow('Stack ID is required');
    });

    it('should create a payment successfully', async () => {
      const fakeStack = { _id: 'stack1', stack_price: 100, stack_name: 'Premium' };
      const fakeResponse = { checkoutUrl: 'https://checkout.payos.com/123' };

      Stack.findById.mockResolvedValue(fakeStack);
      Payment.prototype.save = jest.fn().mockResolvedValue({});
      payOS.createPaymentLink.mockResolvedValue(fakeResponse);

      const result = await PaymentService.createPayment('stack1', 'user1');

      expect(Stack.findById).toHaveBeenCalledWith('stack1');
      expect(result.url).toBe(fakeResponse.checkoutUrl);
      expect(result.message).toBe('Payment created');
    });
  });

  describe('handlePaymentCallback', () => {
    it('should update payment status to completed when status is PAID', async () => {
      const mockPayment = { payment_status: 'pending', save: jest.fn() };
      Payment.findOne.mockResolvedValue(mockPayment);

      const result = await PaymentService.handlePaymentCallback('12345', 'PAID');
      expect(mockPayment.payment_status).toBe('completed');
      expect(result.message).toBe('Payment status updated successfully');
    });

    it('should throw error if payment not found', async () => {
      Payment.findOne.mockResolvedValue(null);
      await expect(PaymentService.handlePaymentCallback('999', 'PAID'))
        .rejects
        .toThrow('Payment not found');
    });
  });

  describe('getPaymentById', () => {
    it('should throw if invalid ID', async () => {
      await expect(PaymentService.getPaymentById('invalid'))
        .rejects
        .toThrow('Invalid payment ID');
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

  describe('updatePayment', () => {
    it('should update payment successfully', async () => {
      const mockPayment = { _id: '1', payment_status: 'completed' };
      Payment.findByIdAndUpdate.mockResolvedValue(mockPayment);

      const result = await PaymentService.updatePayment('507f1f77bcf86cd799439011', { payment_status: 'completed' });
      expect(result).toEqual(mockPayment);
    });
  });

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
  });

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
  });
});
