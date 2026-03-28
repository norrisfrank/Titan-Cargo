const express = require('express');
const ship24Service = require('../services/ship24');
const { query } = require('../db');
const router = express.Router();

/**
 * GET /api/tracking/:number
 * Fetches real-time timeline from Ship24 Integration and maps it to the frontend Tracker UI
 */
router.get('/:number', async (req, res) => {
    const { number } = req.params;

    if (!number) {
        return res.status(400).json({ error: 'Tracking number is required' });
    }

    try {
        // Here we would sync with Ship24 for the live scan nodes
        const trackingData = await ship24Service.trackPackage(number);

        // Optionally, we log the tracking history hook into our internal DB if requested
        await query(
            `INSERT INTO tracking_history (tracking_number, status, location)
             VALUES ($1, $2, $3)`,
             [number, trackingData.status, trackingData.milestones[trackingData.milestones.length-1].location]
        );

        res.json({
            success: true,
            data: trackingData
        });
    } catch (err) {
        console.error('Tracking Route Error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve live tracking data from provider.' });
    }
});

module.exports = router;
