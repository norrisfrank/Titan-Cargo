const http = require('http');
const app = require('./app');
const { autoProgressEligibleBookings } = require('./services/bookingStatus');

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

const enableSimulation = process.env.ENABLE_SHIPMENT_SIMULATION === 'true';

if (enableSimulation) {
  const minutes = Number(process.env.SHIPMENT_SIM_INTERVAL_MINUTES || '5');
  const intervalMs = Math.max(minutes, 1) * 60 * 1000;

  setInterval(() => {
    autoProgressEligibleBookings({ performedByUserId: null }).catch((err) => {
      console.error('Shipment simulation worker error:', err);
    });
  }, intervalMs);
}

server.listen(PORT, () => {
  console.log(`Titan backend server running on http://localhost:${PORT}`);
});
