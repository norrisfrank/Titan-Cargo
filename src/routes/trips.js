const express = require('express');
const { query } = require('../db');
const { requireRole } = require('../middleware/auth');

const router = express.Router();

// Mirrors mockData.projects from Titan.html for now.
const trips = [
  {
    id: 'FLT-900',
    destination: 'JFK, NY',
    departure: 'Mar 3, 2025 09:00',
    arrival: 'Mar 3, 2025 13:00',
    fuel: 2500,
    distance: 2200,
    driver: 'Alex King',
    codriver: 'Sara Queen',
    borderPermit: 'BCP-2025-001',
    taxValuation: 'KES2,500',
    deliveryReceipt: 'RCPT-9001',
  },
  {
    id: 'FLT-901',
    destination: 'LAX, CA',
    departure: 'Mar 4, 2025 14:00',
    arrival: 'Mar 4, 2025 18:30',
    fuel: 2600,
    distance: 2300,
    driver: 'Tom Lane',
    codriver: 'Eva Miles',
    borderPermit: 'BCP-2025-002',
    taxValuation: 'KES2,700',
    deliveryReceipt: 'RCPT-9002',
  },
  {
    id: 'FLT-902',
    destination: 'ORD, IL',
    departure: 'Mar 5, 2025 07:00',
    arrival: 'Mar 5, 2025 11:30',
    fuel: 2400,
    distance: 2100,
    driver: 'Sam Lee',
    codriver: 'Nina Fox',
    borderPermit: 'BCP-2025-003',
    taxValuation: 'KES2,300',
    deliveryReceipt: 'RCPT-9003',
  },
  {
    id: 'FLT-903',
    destination: 'ATL, GA',
    departure: 'Mar 6, 2025 10:00',
    arrival: 'Mar 6, 2025 14:20',
    fuel: 2550,
    distance: 2250,
    driver: 'Chris Ray',
    codriver: 'Lily Moon',
    borderPermit: 'BCP-2025-004',
    taxValuation: 'KES2,600',
    deliveryReceipt: 'RCPT-9004',
  },
  {
    id: 'FLT-904',
    destination: 'DFW, TX',
    departure: 'Mar 7, 2025 12:00',
    arrival: 'Mar 7, 2025 16:30',
    fuel: 2650,
    distance: 2350,
    driver: 'Ben Star',
    codriver: 'Mia Sun',
    borderPermit: 'BCP-2025-005',
    taxValuation: 'KES2,800',
    deliveryReceipt: 'RCPT-9005',
  },
];

router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT
         id,
         flight_code,
         destination,
         departure_ts,
         arrival_ts,
         fuel_liters,
         distance_km,
         driver,
         co_driver,
         border_permit,
         tax_valuation,
         delivery_receipt
       FROM trips
       ORDER BY departure_ts DESC`
    );

    const rows = result.rows || [];

    const payload = rows.map((row) => ({
      id: row.flight_code || `TRIP-${row.id}`,
      destination: row.destination,
      departure: row.departure_ts,
      arrival: row.arrival_ts,
      fuel: row.fuel_liters != null ? Number(row.fuel_liters) : null,
      distance: row.distance_km != null ? Number(row.distance_km) : null,
      driver: row.driver,
      codriver: row.co_driver,
      borderPermit: row.border_permit,
      taxValuation: row.tax_valuation,
      deliveryReceipt: row.delivery_receipt,
    }));

    return res.json(payload);
  } catch (err) {
    console.error('Trips list error:', err);
    return res.status(500).json({ error: 'Failed to load trips' });
  }
});

router.post('/', requireRole('ADMIN', 'OPERATIONS'), async (req, res) => {
  const b = req.body || {};
  const flightCode = (b.id || b.flightCode || '').trim();
  const destination = (b.destination || '').trim();
  const departure = b.departure || null;
  const arrival = b.arrival || null;
  const fuelLiters = b.fuel != null ? Number(b.fuel) : null;
  const distanceKm = b.distance != null ? Number(b.distance) : null;
  const driver = (b.driver || '').trim();
  const coDriver = (b.codriver || b.coDriver || '').trim();
  const borderPermit = (b.borderPermit || '').trim();
  const taxValuation = (b.taxValuation || '').trim();
  const deliveryReceipt = (b.deliveryReceipt || '').trim();

  if (!flightCode || !destination || !departure || !arrival || !driver) {
    return res.status(400).json({ error: 'id, destination, departure, arrival and driver are required' });
  }

  try {
    const insert = await query(
      `INSERT INTO trips (flight_code, destination, departure_ts, arrival_ts, fuel_liters, distance_km, driver, co_driver, border_permit, tax_valuation, delivery_receipt)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id, flight_code, destination, departure_ts, arrival_ts, fuel_liters, distance_km, driver, co_driver, border_permit, tax_valuation, delivery_receipt`,
      [
        flightCode,
        destination,
        departure,
        arrival,
        fuelLiters,
        distanceKm,
        driver,
        coDriver || null,
        borderPermit || null,
        taxValuation || null,
        deliveryReceipt || null,
      ]
    );

    const row = insert.rows[0];
    return res.status(201).json({
      id: row.flight_code || `TRIP-${row.id}`,
      destination: row.destination,
      departure: row.departure_ts,
      arrival: row.arrival_ts,
      fuel: row.fuel_liters != null ? Number(row.fuel_liters) : null,
      distance: row.distance_km != null ? Number(row.distance_km) : null,
      driver: row.driver,
      codriver: row.co_driver,
      borderPermit: row.border_permit,
      taxValuation: row.tax_valuation,
      deliveryReceipt: row.delivery_receipt,
    });
  } catch (err) {
    console.error('Trips create error:', err);
    return res.status(500).json({ error: 'Failed to create trip' });
  }
});

module.exports = router;
