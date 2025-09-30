require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const PayOS = require('@payos/node');

const app = express();
app.use(bodyParser.json());

const payOS = new PayOS(
  process.env.PAYOS_CLIENT_ID,
  process.env.PAYOS_API_KEY,
  process.env.PAYOS_CHECKSUM_KEY
);

app.post('/create-payment', async (req, res) => {
  try {
    const { amount, description, currency } = req.body;

    if (!amount || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate unique orderCode
    const orderCode = `txn-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const payload = {
      orderCode,
      amount: parseInt(amount),
      description,
      currency: currency || 'VND',
      returnUrl: `${process.env.BACKEND_URL}/payment/success`,
      cancelUrl: `${process.env.BACKEND_URL}/payment/cancel`,
    };

    // Call PayOS
    const response = await payOS.createPaymentLink(payload);

    res.json({
      error: 0,
      message: 'Payment link created',
      checkoutUrl: response.checkoutUrl,
      orderCode,
    });
  } catch (err) {
    console.error('Error creating payment:', err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
