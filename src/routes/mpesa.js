const express = require('express');
const { query } = require('../db');
const mpesaService = require('../services/mpesa');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

/**
 * POST /api/mpesa/stk
 * Requires Auth (Client paying for a quote)
 */
router.post('/stk', requireAuth, async (req, res) => {
    const { quoteRequestId, phone, amount } = req.body;

    if (!quoteRequestId || !phone || !amount) {
        return res.status(400).json({ error: 'Quote ID, phone, and amount are required' });
    }

    try {
        // Init Daraja STK Push
        const paymentReference = `QTN${quoteRequestId}`;
        const stkResponse = await mpesaService.initiateSTKPush(phone, amount, paymentReference);

        if (stkResponse.ResponseCode === '0') {
            // Save Payment Intent
            await query(
                `INSERT INTO payments (quote_request_id, merchant_request_id, checkout_request_id, amount, phone_number)
                 VALUES ($1, $2, $3, $4, $5)`,
                [quoteRequestId, stkResponse.MerchantRequestID, stkResponse.CheckoutRequestID, amount, phone]
            );

            return res.json({ success: true, message: 'STK Push sent to your phone. Please authorize payment.', response: stkResponse });
        } else {
            return res.status(500).json({ error: 'Safaricom declined STK request', details: stkResponse });
        }
    } catch (err) {
        console.error('M-Pesa Route Error:', err.message);
        res.status(500).json({ error: 'Payment processing failed. Check internal logs/API keys.' });
    }
});

/**
 * POST /api/mpesa/callback
 * Safaricom hits this URL upon success/fail (Server-to-Server, so no strict JWT requireAuth)
 */
router.post('/callback', async (req, res) => {
    try {
        const payload = req.body?.Body?.stkCallback;
        if (!payload) return res.status(400).json({ error: 'Invalid callback payload' });

        const checkoutRequestId = payload.CheckoutRequestID;
        const resultCode = payload.ResultCode;

        if (resultCode === 0) {
            // Success
            await query(`UPDATE payments SET status = 'COMPLETED' WHERE checkout_request_id = $1`, [checkoutRequestId]);
        } else {
            // Failed
            await query(`UPDATE payments SET status = 'FAILED' WHERE checkout_request_id = $1`, [checkoutRequestId]);
        }

        res.json({ success: true });
    } catch (err) {
        console.error('M-Pesa Callback Error:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
