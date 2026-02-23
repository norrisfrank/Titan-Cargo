-- PostgreSQL schema for Titan Cargo backend

CREATE TABLE IF NOT EXISTS users (
  id            BIGSERIAL PRIMARY KEY,
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,
  password_hash TEXT        NOT NULL,
  role          TEXT        NOT NULL DEFAULT 'User',
  photo_url     TEXT,
  skills        TEXT,
  vision        TEXT,
  is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clients (
  id             BIGSERIAL PRIMARY KEY,
  name           TEXT        NOT NULL,
  contact_person TEXT,
  email          TEXT,
  phone          TEXT,
  contract_value NUMERIC(14,2),
  status         TEXT,
  plane_type     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id              BIGSERIAL PRIMARY KEY,
  airway_bill     TEXT        NOT NULL UNIQUE,
  details         TEXT        NOT NULL,
  departure_date  DATE        NOT NULL,
  departure_time  TIME        NOT NULL,
  arrival_date    DATE        NOT NULL,
  arrival_time    TIME        NOT NULL,
  origin          TEXT        NOT NULL,
  destination     TEXT        NOT NULL,
  weight_kg       NUMERIC(12,2) NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'CREATED',
  state           TEXT,
  client_id       BIGINT      REFERENCES clients(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_log (
  id            BIGSERIAL PRIMARY KEY,
  entity_type   TEXT        NOT NULL,
  entity_id     BIGINT      NOT NULL,
  action        TEXT        NOT NULL,
  performed_by  BIGINT      REFERENCES users(id) ON DELETE SET NULL,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trips (
  id               BIGSERIAL PRIMARY KEY,
  flight_code      TEXT        NOT NULL,
  destination      TEXT        NOT NULL,
  departure_ts     TIMESTAMPTZ NOT NULL,
  arrival_ts       TIMESTAMPTZ NOT NULL,
  fuel_liters      NUMERIC(14,2) NOT NULL,
  distance_km      NUMERIC(14,2) NOT NULL,
  driver           TEXT        NOT NULL,
  co_driver        TEXT,
  border_permit    TEXT,
  tax_valuation    TEXT,
  delivery_receipt TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vehicles (
  id         BIGSERIAL PRIMARY KEY,
  name       TEXT,
  kind       TEXT        NOT NULL, -- ship | plane | train | truck
  status     TEXT        NOT NULL, -- operating | grounded
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
