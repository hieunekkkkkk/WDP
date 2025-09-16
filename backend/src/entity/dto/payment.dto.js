class PaymentDTO {
  constructor(data) {
    this.user_id = data.user_id;
    this.payment_amount = data.payment_amount;
    this.payment_stack = data.payment_stack;
    this.payment_date = data.payment_date;
    this.payment_number = data.payment_number;
    this.payment_status = data.payment_status;
    this.payment_method = data.payment_method;
    this.transaction_id = data.transaction_id;
  }
}

module.exports = PaymentDTO; 