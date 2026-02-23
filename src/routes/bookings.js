const express = require('express');
const { query } = require('../db');
const { updateBookingStatus } = require('../services/bookingStatus');
const { requireRole, normalizeRole } = require('../middleware/auth');
const { logAudit } = require('../services/audit');
const { isNonEmptyString } = require('../utils/validation');

const router = express.Router();

async function generateUniqueAirwayBill() {
  for (let i = 0; i < 5; i += 1) {
    const candidate = 'AWB' + Math.floor(100000 + Math.random() * 900000);
    const existing = await query('SELECT 1 FROM bookings WHERE airway_bill = $1', [candidate]);
    if (!existing.rows || existing.rows.length === 0) {
      return candidate;
    }
  }

  throw new Error('Failed to generate unique airway bill');
}

// For now this mirrors the mockData.cargo from Titan.html so the frontend works
// even before we wire it to a real PostgreSQL table.
const bookings = [
  {
    airwayBill: 'AWB123456',
    details: 'Electronics - 20 boxes',
    departureDate: 'Mar 1, 2025',
    departureTime: '08:00',
    arrivalDate: 'Mar 2, 2025',
    arrivalTime: '14:00',
    from: 'LAX',
    to: 'JFK',
    weight: 1200,
    status: 'Delivered',
    state: 'CA',
    client: { name: 'Acme Corp', info: 'acme@example.com' },
  },
  {
    airwayBill: 'AWB123457',
    details: 'Books - 10 boxes',
    departureDate: 'Mar 1, 2025',
    departureTime: '09:00',
    arrivalDate: 'Mar 2, 2025',
    arrivalTime: '15:00',
    from: 'ORD',
    to: 'LGA',
    weight: 500,
    status: 'Delivered',
    state: 'IL',
    client: { name: 'BookWorld', info: 'info@bookworld.com' },
  },
  {
    airwayBill: 'AWB654321',
    details: 'Pharmaceuticals - 10 pallets',
    departureDate: 'Mar 3, 2025',
    departureTime: '10:30',
    arrivalDate: 'Mar 4, 2025',
    arrivalTime: '16:45',
    from: 'DFW',
    to: 'MIA',
    weight: 3500,
    status: 'In Transit',
    state: 'TX',
    client: { name: 'HealthPlus', info: 'contact@healthplus.com' },
  },
  {
    airwayBill: 'AWB654322',
    details: 'Furniture - 5 sets',
    departureDate: 'Mar 3, 2025',
    departureTime: '11:00',
    arrivalDate: 'Mar 5, 2025',
    arrivalTime: '18:00',
    from: 'PHX',
    to: 'SEA',
    weight: 2000,
    status: 'In Transit',
    state: 'AZ',
    client: { name: 'FurniCo', info: 'sales@furnico.com' },
  },
  {
    airwayBill: 'AWB789012',
    details: 'Machinery - 2 crates',
    departureDate: 'Mar 2, 2025',
    departureTime: '13:00',
    arrivalDate: 'Mar 5, 2025',
    arrivalTime: '09:30',
    from: 'DEN',
    to: 'BOS',
    weight: 2200,
    status: 'Processing',
    state: 'CO',
    client: { name: 'BuildIt', info: 'info@buildit.com' },
  },
  {
    airwayBill: 'AWB789013',
    details: 'Medical Equipment',
    departureDate: 'Mar 2, 2025',
    departureTime: '14:00',
    arrivalDate: 'Mar 6, 2025',
    arrivalTime: '10:00',
    from: 'ATL',
    to: 'CLT',
    weight: 900,
    status: 'Processing',
    state: 'GA',
    client: { name: 'MedTech', info: 'contact@medtech.com' },
  },
  {
    airwayBill: 'AWB345678',
    details: 'Textiles - 50 rolls',
    departureDate: 'Mar 1, 2025',
    departureTime: '07:15',
    arrivalDate: 'Mar 3, 2025',
    arrivalTime: '12:00',
    from: 'MCO',
    to: 'EWR',
    weight: 1800,
    status: 'Stuck',
    state: 'FL',
    client: { name: 'FashionHouse', info: 'orders@fashionhouse.com' },
  },
  {
    airwayBill: 'AWB345679',
    details: 'Auto Parts',
    departureDate: 'Mar 1, 2025',
    departureTime: '08:30',
    arrivalDate: 'Mar 4, 2025',
    arrivalTime: '13:00',
    from: 'SEA',
    to: 'DTW',
    weight: 1500,
    status: 'Stuck',
    state: 'WA',
    client: { name: 'AutoZone', info: 'support@autozone.com' },
  },
  {
    airwayBill: 'AWB999001',
    details:
      'Classified Documents - Level 5<br><span style="color:#e74c3c;font-weight:bold;">Government Classified</span><br>Security: Armed Escort, GPS Tracking',
    departureDate: 'Mar 5, 2025',
    departureTime: '06:00',
    arrivalDate: 'Mar 5, 2025',
    arrivalTime: '12:00',
    from: 'DCA',
    to: 'LAX',
    weight: 50,
    status: 'In Transit',
    state: 'DC',
    client: { name: 'US Gov', info: 'Contact: Secure Line' },
  },
  {
    airwayBill: 'AWB999002',
    details:
      'Nuclear Material - Secure Container<br><span style="color:#e74c3c;font-weight:bold;">Government Classified</span><br>Security: Hazmat, Armed Convoy, Real-time Monitoring',
    departureDate: 'Mar 6, 2025',
    departureTime: '04:00',
    arrivalDate: 'Mar 7, 2025',
    arrivalTime: '18:00',
    from: 'SFO',
    to: 'ORF',
    weight: 200,
    status: 'Processing',
    state: 'CA',
    client: { name: 'DOE', info: 'Contact: Secure Line' },
  },
  {
    airwayBill: 'AWB888888',
    details: 'Luxury Cars - 3 units',
    departureDate: 'Mar 8, 2025',
    departureTime: '10:00',
    arrivalDate: 'Mar 10, 2025',
    arrivalTime: '16:00',
    from: 'DET',
    to: 'MIA',
    weight: 6000,
    status: 'In Transit',
    state: 'MI',
    client: { name: 'AutoLux', info: 'lux@autolux.com' },
  },
];

router.get('/', async (req, res) => {
  try {
    const user = req.user || {};
    const role = normalizeRole(user.role);

    let sql = `SELECT
         b.id,
         b.airway_bill,
         b.details,
         b.departure_date,
         b.departure_time,
         b.arrival_date,
         b.arrival_time,
         b.origin,
         b.destination,
         b.weight_kg,
         b.status,
         b.state,
         c.name AS client_name,
         COALESCE(c.email, c.phone, '') AS client_info
       FROM bookings b
       LEFT JOIN clients c ON b.client_id = c.id`;

    const params = [];

    if (role === 'CLIENT' && user.email) {
      sql += ' WHERE c.email = $1';
      params.push(user.email);
    }

    sql += ' ORDER BY b.created_at DESC';

    const result = await query(sql, params);

    const rows = result.rows || [];

    const payload = rows.map((row) => ({
      id: row.id,
      airwayBill: row.airway_bill,
      details: row.details,
      departureDate: row.departure_date,
      departureTime: row.departure_time,
      arrivalDate: row.arrival_date,
      arrivalTime: row.arrival_time,
      from: row.origin,
      to: row.destination,
      weight: row.weight_kg != null ? Number(row.weight_kg) : null,
      status: row.status,
      state: row.state,
      client: {
        name: row.client_name || 'Unknown',
        info: row.client_info || '',
      },
    }));

    return res.json(payload);
  } catch (err) {
    console.error('Bookings list error:', err);
    return res.status(500).json({ error: 'Failed to load bookings' });
  }
});

router.post('/', async (req, res) => {
  const user = req.user || {};
  const body = req.body || {};

  const description = body.description || body.details || '';
  const cargoType = body.cargoType || 'general';
  const origin = body.origin || '';
  const destination = body.destination || '';
  const declaredValueRaw = body.declaredValue;
  const weightRaw = body.weight;
  const weightUnitRaw = body.weightUnit || 'kg';
  const modeRaw = body.mode || 'air';
  const fragile = Boolean(body.fragile);
  const hazardous = Boolean(body.hazardous);
  const notifyPreference = body.notifyPreference || 'email';
  const notifyEmail = body.notifyEmail || '';
  const notifyPhone = body.notifyPhone || '';
  const billingMethod = body.billingMethod || 'mpesa';

  if (!isNonEmptyString(description, 3) || !isNonEmptyString(origin, 2) || !isNonEmptyString(destination, 2)) {
    return res.status(400).json({ error: 'description, origin and destination are required' });
  }

  const weightNumber = Number(weightRaw);
  if (!Number.isFinite(weightNumber) || weightNumber <= 0) {
    return res.status(400).json({ error: 'weight must be a positive number' });
  }

  const weightUnit = String(weightUnitRaw).toLowerCase();
  let weightKg = weightNumber;
  if (weightUnit === 'tonnes' || weightUnit === 'tons' || weightUnit === 'ton') {
    weightKg = weightNumber * 1000;
  }

  const declaredValueNumber =
    declaredValueRaw === undefined || declaredValueRaw === null || declaredValueRaw === ''
      ? null
      : Number(declaredValueRaw);

  let clientId = null;
  let clientPayload = null;

  try {
    if (notifyEmail || notifyPhone) {
      const existingClientRes = await query(
        'SELECT id, name, email, phone FROM clients WHERE (email = $1 AND $1 IS NOT NULL) OR (phone = $2 AND $2 IS NOT NULL) LIMIT 1',
        [notifyEmail || null, notifyPhone || null]
      );

      const existingClient = existingClientRes.rows && existingClientRes.rows[0];

      if (existingClient) {
        clientId = existingClient.id;
        clientPayload = {
          name: existingClient.name || 'Unknown',
          info: existingClient.email || existingClient.phone || '',
        };
      } else {
        const clientName = notifyEmail || notifyPhone || 'New Client';
        const contactPerson = user.email || null;

        const insertClientRes = await query(
          `INSERT INTO clients (name, contact_person, email, phone, status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, name, email, phone`,
          [clientName, contactPerson, notifyEmail || null, notifyPhone || null, 'Active']
        );

        const insertedClient = insertClientRes.rows[0];
        clientId = insertedClient.id;
        clientPayload = {
          name: insertedClient.name || 'Unknown',
          info: insertedClient.email || insertedClient.phone || '',
        };
      }
    }

    const airwayBill = await generateUniqueAirwayBill();

    const now = new Date();
    const departureDate = now.toISOString().slice(0, 10);
    const departureTime = now.toTimeString().slice(0, 8);
    const arrivalDateObj = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const arrivalDate = arrivalDateObj.toISOString().slice(0, 10);
    const arrivalTime = arrivalDateObj.toTimeString().slice(0, 8);

    const detailsParts = [description.trim()];
    if (cargoType) detailsParts.push(`Type: ${cargoType}`);
    if (fragile) detailsParts.push('Fragile');
    if (hazardous) detailsParts.push('Hazardous');
    const details = detailsParts.join(' | ');

    const mode = typeof modeRaw === 'string' ? modeRaw.toLowerCase() : 'air';
    const state = mode.toUpperCase();

    const insertBookingRes = await query(
      `INSERT INTO bookings (airway_bill, details, departure_date, departure_time, arrival_date, arrival_time,
                             origin, destination, weight_kg, status, state, client_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING id, airway_bill, details, departure_date, departure_time, arrival_date, arrival_time,
                 origin, destination, weight_kg, status, state`,
      [
        airwayBill,
        details,
        departureDate,
        departureTime,
        arrivalDate,
        arrivalTime,
        origin,
        destination,
        weightKg,
        'CREATED',
        state,
        clientId,
      ]
    );

    const booking = insertBookingRes.rows[0];

    await logAudit({
      entityType: 'BOOKING',
      entityId: booking.id,
      action: 'CREATE',
      performedByUserId: user.userId || null,
      metadata: {
        source: 'configure',
        mode,
        notifyPreference,
        notifyEmail: notifyEmail || null,
        notifyPhone: notifyPhone || null,
        billingMethod,
        declaredValue: Number.isFinite(declaredValueNumber) ? declaredValueNumber : null,
        fragile,
        hazardous,
      },
    });

    const responsePayload = {
      id: booking.id,
      airwayBill: booking.airway_bill,
      details: booking.details,
      departureDate: booking.departure_date,
      departureTime: booking.departure_time,
      arrivalDate: booking.arrival_date,
      arrivalTime: booking.arrival_time,
      from: booking.origin,
      to: booking.destination,
      weight: booking.weight_kg != null ? Number(booking.weight_kg) : null,
      status: booking.status,
      state: booking.state,
      client:
        clientPayload || {
          name: 'Unknown',
          info: '',
        },
    };

    return res.status(201).json(responsePayload);
  } catch (err) {
    console.error('Create booking error:', err);
    return res.status(500).json({ error: 'Failed to create booking' });
  }
});

router.patch('/:id/status', requireRole('ADMIN', 'OPERATIONS'), async (req, res) => {
  const bookingId = req.params.id;
  const body = req.body || {};
  const nextStatus = body.status || body.nextStatus;
  const reason = body.reason;

  if (!nextStatus) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const result = await updateBookingStatus({
      bookingId,
      nextStatus,
      performedByUserId: req.user && req.user.userId,
      reason,
    });

    return res.json({
      id: result.id,
      from: result.from,
      to: result.to,
      changed: result.changed,
    });
  } catch (err) {
    if (err.code === 'BOOKING_NOT_FOUND') {
      return res.status(404).json({ error: err.message, code: err.code });
    }

    if (
      err.code === 'INVALID_ID' ||
      err.code === 'INVALID_STATUS' ||
      err.code === 'INVALID_TRANSITION'
    ) {
      return res.status(400).json({ error: err.message, code: err.code });
    }

    console.error('Update booking status error:', err);
    return res.status(500).json({ error: 'Failed to update booking status' });
  }
});

router.get('/:id/history', requireRole('ADMIN', 'OPERATIONS'), async (req, res) => {
  const bookingIdRaw = req.params.id;
  const bookingId = Number(bookingIdRaw);

  if (!Number.isInteger(bookingId) || bookingId <= 0) {
    return res.status(400).json({ error: 'Invalid booking id' });
  }

  try {
    const result = await query(
      `SELECT id, entity_type, entity_id, action, performed_by, metadata, created_at
       FROM audit_log
       WHERE entity_type = 'BOOKING' AND entity_id = $1
       ORDER BY created_at ASC`,
      [bookingId]
    );

    const rows = result.rows || [];

    const history = rows.map((row) => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      action: row.action,
      performedBy: row.performed_by,
      metadata: row.metadata,
      createdAt: row.created_at,
    }));

    return res.json({ bookingId, history });
  } catch (err) {
    console.error('Booking history error:', err);
    return res.status(500).json({ error: 'Failed to load booking history' });
  }
});

module.exports = router;
