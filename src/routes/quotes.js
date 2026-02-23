const express = require('express');
const { query } = require('../db');
const { isValidEmail, isNonEmptyString } = require('../utils/validation');

const router = express.Router();

/**
 * POST /api/quotes
 * Public endpoint to submit a quote request
 */
router.post('/', async (req, res) => {
    const { origin, destination, weight, type, email } = req.body;

    // Validation
    if (!isValidEmail(email)) {
        return res.status(400).json({ error: 'Valid email is required' });
    }
    if (!isNonEmptyString(origin) || !isNonEmptyString(destination) || !isNonEmptyString(type)) {
        return res.status(400).json({ error: 'Origin, destination, and type are required' });
    }

    try {
        const result = await query(
            `INSERT INTO quote_requests (origin, destination, weight_kg, cargo_type, contact_email)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
            [origin, destination, weight || null, type, email]
        );

        res.status(201).json({
            success: true,
            message: 'Quote request submitted successfully',
            requestId: result[0].id
        });
    } catch (err) {
        console.error('Error submitting quote request:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
