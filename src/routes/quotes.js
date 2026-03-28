const express = require('express');
const { query } = require('../db');
const { isValidEmail, isNonEmptyString } = require('../utils/validation');
const easyshipService = require('../services/easyship');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /api/quotes
 * Public endpoint to submit a quote request and fetch realtime Easyship rates
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
            [origin, destination, weight || 10, type, email]
        );

        // Fetch Live Rates from Easyship Integration
        const rates = await easyshipService.getRates(origin, destination, weight || 10, type);

        res.status(201).json({
            success: true,
            message: 'Quote request generated successfully',
            requestId: result.rows[0].id,
            rates: rates
        });
    } catch (err) {
        console.error('Error submitting quote request:', err.message);
        const isTableMissing = err.message && err.message.includes('relation "quote_requests" does not exist');
        res.status(500).json({
            error: isTableMissing ? 'Database table quote_requests is missing. Please run the SQL initialization.' : 'Internal server error'
        });
    }
});

router.get('/', requireAuth, async (req, res) => {
    // Only ADMIN or OPERATIONS should see all quotes ideally
    if (req.user.role !== 'ADMIN' && req.user.role !== 'OPERATIONS') {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const result = await query('SELECT * FROM quote_requests ORDER BY created_at DESC');
        res.json({ quotes: result.rows });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch quotes' });
    }
});

router.patch('/:id/approve', requireAuth, async (req, res) => {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'OPERATIONS') {
        return res.status(403).json({ error: 'Access denied' });
    }
    try {
        const result = await query(
            'UPDATE quote_requests SET status = $1 WHERE id = $2 RETURNING *',
            ['APPROVED', req.params.id]
        );
        if (result.rowCount === 0) return res.status(404).json({ error: 'Quote not found' });
        res.json({ success: true, quote: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Failed to approve quote' });
    }
});

module.exports = router;
