const axios = require('axios');
require('dotenv').config();

// M-Pesa Daraja exact logic.
async function getAuthToken() {
    try {
        const key = process.env.MPESA_CONSUMER_KEY || 'sandbox_consumer_key';
        const secret = process.env.MPESA_CONSUMER_SECRET || 'sandbox_consumer_secret';
        const auth = Buffer.from(`${key}:${secret}`).toString('base64');
        
        // Mock if ENV missing (prevents crash on sandbox)
        if (key === 'sandbox_consumer_key') return 'mock_token_123';
        
        const res = await axios.get('https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials', {
            headers: { Authorization: `Basic ${auth}` }
        });
        return res.data.access_token;
    } catch (e) {
        throw new Error('M-Pesa auth failed');
    }
}

exports.initiateSTKPush = async (phone, amount, reference) => {
    try {
        const token = await getAuthToken();
        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const shortcode = process.env.MPESA_SHORTCODE || '174379';
        const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
        
        const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

        // MOCK INTERCEPTOR for sandbox execution so we don't need real 254 safaricom testing numbers
        if (process.env.NODE_ENV !== 'production' && token === 'mock_token_123') {
            return {
                MerchantRequestID: 'Req_' + Math.floor(Math.random() * 100000),
                CheckoutRequestID: 'chk_' + Math.floor(Math.random() * 100000),
                ResponseCode: "0",
                ResponseDescription: "Success. Request accepted for processing",
                CustomerMessage: "Success. Request accepted for processing"
            };
        }

        // --- REAL DARAJA IMPLEMENTATION ---
        const response = await axios.post('https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest', {
            BusinessShortCode: shortcode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline',
            Amount: Number(amount),
            PartyA: phone,
            PartyB: shortcode,
            PhoneNumber: phone,
            CallBackURL: process.env.MPESA_CALLBACK_URL || 'https://titan-cargo-app.com/api/mpesa/callback',
            AccountReference: reference,
            TransactionDesc: 'Cargo Logistics Payment'
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        return response.data;
    } catch (error) {
        console.error('M-Pesa STK Error:', error.response?.data || error.message);
        throw new Error('STK Push initiation failed');
    }
};
