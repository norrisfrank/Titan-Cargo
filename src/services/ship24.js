const axios = require('axios');

exports.trackPackage = async (trackingNumber) => {
    try {
        // Mocked Timeline Payload simulating an active trans-continental package
        // This is safe to run without real API keys
        return {
            trackingNumber: trackingNumber,
            status: 'IN_TRANSIT',
            milestones: [
                { timestamp: new Date(Date.now() - 86400000*2).toISOString(), location: 'Los Angeles, USA', status: 'Picked Up by Courier' },
                { timestamp: new Date(Date.now() - 86400000).toISOString(), location: 'New York, USA', status: 'Departed Hub Facility' },
                { timestamp: new Date().toISOString(), location: 'London, GB', status: 'In Transit to Destination' }
            ],
            currentLocation: { lat: 51.5072, lng: -0.1276, name: 'London Heathrow HUB' },
            estimatedDelivery: new Date(Date.now() + 86400000*3).toISOString()
        };
    } catch (error) {
        throw new Error('Failed to retrieve tracking data');
    }
};
