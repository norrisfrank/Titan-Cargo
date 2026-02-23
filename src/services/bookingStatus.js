const { query } = require('../db');
const { logAudit } = require('./audit');

const STATUSES = {
  CREATED: 'CREATED',
  CONFIRMED: 'CONFIRMED',
  IN_TRANSIT: 'IN_TRANSIT',
  ARRIVED: 'ARRIVED',
  DELIVERED: 'DELIVERED',
  CLOSED: 'CLOSED',
  CANCELLED: 'CANCELLED',
};

const ALL_STATUSES = Object.values(STATUSES);

const ALLOWED_TRANSITIONS = {
  [STATUSES.CREATED]: [STATUSES.CONFIRMED, STATUSES.CANCELLED],
  [STATUSES.CONFIRMED]: [STATUSES.IN_TRANSIT, STATUSES.CANCELLED],
  [STATUSES.IN_TRANSIT]: [STATUSES.ARRIVED],
  [STATUSES.ARRIVED]: [STATUSES.DELIVERED],
  [STATUSES.DELIVERED]: [STATUSES.CLOSED],
  [STATUSES.CLOSED]: [],
  [STATUSES.CANCELLED]: [],
};

function normalizeStatus(raw) {
  if (!raw) return null;
  const upper = String(raw).trim().toUpperCase().replace(/[\s-]+/g, '_');

  if (upper === 'INTRANSIT') return STATUSES.IN_TRANSIT;

  if (upper === 'PROCESSING') return STATUSES.CREATED;
  if (upper === 'STUCK') return STATUSES.IN_TRANSIT;
  if (upper === 'DELIVERED') return STATUSES.DELIVERED;
  if (upper === 'CANCELED') return STATUSES.CANCELLED;

  if (ALL_STATUSES.includes(upper)) return upper;

  return null;
}

function canTransition(fromRaw, toRaw) {
  const from = normalizeStatus(fromRaw);
  const to = normalizeStatus(toRaw);

  if (!from || !to) return false;
  if (from === to) return true;

  const allowed = ALLOWED_TRANSITIONS[from] || [];
  return allowed.includes(to);
}

function createStatusError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

async function updateBookingStatus({ bookingId, nextStatus, performedByUserId, reason }) {
  const numericId = Number(bookingId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    throw createStatusError('INVALID_ID', 'Invalid booking id');
  }

  const next = normalizeStatus(nextStatus);
  if (!next) {
    throw createStatusError('INVALID_STATUS', 'Invalid or unsupported status value');
  }

  const result = await query('SELECT id, status FROM bookings WHERE id = $1', [numericId]);
  const currentRow = result.rows[0];

  if (!currentRow) {
    throw createStatusError('BOOKING_NOT_FOUND', 'Booking not found');
  }

  const current = normalizeStatus(currentRow.status);

  if (current === next) {
    return { id: currentRow.id, from: current, to: next, changed: false };
  }

  if (!canTransition(current, next)) {
    throw createStatusError(
      'INVALID_TRANSITION',
      `Cannot transition booking ${numericId} from ${current || currentRow.status} to ${next}`
    );
  }

  await query('UPDATE bookings SET status = $1 WHERE id = $2', [next, numericId]);

  await logAudit({
    entityType: 'BOOKING',
    entityId: numericId,
    action: 'STATUS_CHANGE',
    performedByUserId: performedByUserId || null,
    metadata: {
      from: current,
      to: next,
      reason: reason || null,
    },
  });

  return { id: currentRow.id, from: current, to: next, changed: true };
}

function nextAutoStatus(currentRaw) {
  const current = normalizeStatus(currentRaw);
  if (!current) return null;
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed[0] || null;
}

async function autoProgressEligibleBookings({ performedByUserId = null, limit = 20 } = {}) {
  const res = await query(
    `SELECT id, status
     FROM bookings
     WHERE status IS NOT NULL`
  );

  let progressed = 0;

  for (const row of res.rows) {
    if (progressed >= limit) break;
    const next = nextAutoStatus(row.status);
    if (!next) continue;

    try {
      const result = await updateBookingStatus({
        bookingId: row.id,
        nextStatus: next,
        performedByUserId,
        reason: 'auto_progress',
      });

      if (result.changed) {
        progressed += 1;
        console.log(
          `[ShipmentSimulation] Auto-progressed booking ${row.id} from ${result.from} to ${result.to}`
        );
      }
    } catch (err) {
      console.error(
        `[ShipmentSimulation] Failed to auto-progress booking ${row.id}:`,
        err.message
      );
    }
  }

  return progressed;
}

module.exports = {
  STATUSES: {
    ...STATUSES,
    ALL: ALL_STATUSES,
  },
  normalizeStatus,
  canTransition,
  updateBookingStatus,
  autoProgressEligibleBookings,
};
