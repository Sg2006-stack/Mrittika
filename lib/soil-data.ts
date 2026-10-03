export type SoilData = {
  soil: {
    health: number | null;
    nitrogen: number | null;
    phosphorus: number | null;
    potassium: number | null;
    moisture: number | null;
    temperature: number | null;
    ph: number | null;
  };
  environment: {
    temperature: number | null;
    humidity: number | null;
    pressure: number | null;
    rainfall: number | null;
    airQuality: number | null;
  };
  water: {
    pumpStatus: string;
    irrigationStatus: string;
  };
  devices: {
    raspberryPi: string;
    esp32: string;
    npkSensor: string;
  };
  readings: Array<{
    timestamp: string;
    nitrogen: number | null;
    phosphorus: number | null;
    potassium: number | null;
    moisture: number | null;
    temperature: number | null;
    humidity: number | null;
  }>;
};

export const soilData: SoilData = {
  soil: {
    health: null,
    nitrogen: null,
    phosphorus: null,
    potassium: null,
    moisture: null,
    temperature: null,
    ph: null,
  },
  environment: {
    temperature: null,
    humidity: null,
    pressure: null,
    rainfall: null,
    airQuality: null,
  },
  water: {
    pumpStatus: "UNAVAILABLE",
    irrigationStatus: "UNAVAILABLE",
  },
  devices: {
    raspberryPi: "ONLINE",
    esp32: "ONLINE",
    npkSensor: "CONNECTED",
  },
  readings: [],
};
