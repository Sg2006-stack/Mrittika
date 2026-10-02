export const soilData = {
  soil: {
    health: 84,
    nitrogen: 42,
    phosphorus: 28,
    potassium: 35,
    moisture: 42,
    temperature: 24.6,
    ph: 6.8,
  },
  environment: {
    temperature: 27.4,
    humidity: 68,
    pressure: 1012,
    rainfall: 4.2,
    airQuality: 92,
  },
  water: {
    tankLevel: 72,
    pumpStatus: "OFF",
    irrigationStatus: "READY",
  },
  devices: {
    raspberryPi: "ONLINE",
    esp32: "ONLINE",
    npkSensor: "CONNECTED",
  },
  readings: [
    { timestamp: "10:30", nitrogen: 42, phosphorus: 28, potassium: 35, moisture: 42, temperature: 24.6, status: "NORMAL" },
    { timestamp: "10:15", nitrogen: 41, phosphorus: 28, potassium: 34, moisture: 44, temperature: 24.4, status: "NORMAL" },
    { timestamp: "10:00", nitrogen: 40, phosphorus: 27, potassium: 34, moisture: 46, temperature: 24.1, status: "NORMAL" },
  ],
} as const;
