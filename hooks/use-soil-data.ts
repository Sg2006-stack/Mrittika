"use client";

import { useEffect, useState } from "react";
import { soilData, type SoilData } from "@/lib/soil-data";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const POLL_INTERVAL_MS = 30_000;
let sharedData = soilData;
let sharedLastUpdated: Date | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let requestController: AbortController | null = null;
const listeners = new Set<() => void>();

type SensorRow = {
  id: number;
  device_id: string;
  created_at: string;
  npk: Record<string, unknown> | null;
  esp32: Record<string, unknown> | null;
};

function numeric(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function nestedData(value: Record<string, unknown> | null) {
  const data = value?.data;
  return data && typeof data === "object" ? data as Record<string, unknown> : value ?? {};
}

function mapSensorRows(rows: SensorRow[]): SoilData {
  const latest = rows[0];
  const npk = nestedData(latest?.npk);
  const esp32 = nestedData(latest?.esp32);
  const latitude = numeric(esp32.latitude);
  const longitude = numeric(esp32.longitude);
  const moisture = numeric(npk.moisture_pct);
  const nitrogen = numeric(npk.nitrogen_mg_kg);
  const phosphorus = numeric(npk.phosphorus_mg_kg);
  const potassium = numeric(npk.potassium_mg_kg);
  const temperature = numeric(npk.temperature_c);
  const healthValues = [moisture, nitrogen, phosphorus, potassium].filter((value): value is number => value !== null);
  const health = healthValues.length === 4
    ? Math.round(Math.min(100, Math.max(0, healthValues.reduce((sum, value) => sum + value, 0) / 4)))
    : null;

  return {
    ...soilData,
    soil: {
      ...soilData.soil,
      health,
      nitrogen,
      phosphorus,
      potassium,
      moisture,
      temperature,
      ph: numeric(npk.ph),
    },
    environment: {
      ...soilData.environment,
      temperature: numeric(esp32.temperature_c),
      humidity: numeric(esp32.humidity_pct),
      pressure: numeric(esp32.pressure_hpa),
      rainfall: numeric(esp32.rain_intensity_estimate_mm_h),
      airQuality: numeric(esp32.mq5_aqi_estimate),
    },
    devices: {
      ...soilData.devices,
      raspberryPi: latest?.device_id ? "ONLINE" : "OFFLINE",
      esp32: latest?.esp32 ? "ONLINE" : "OFFLINE",
      npkSensor: latest?.npk ? "CONNECTED" : "OFFLINE",
    },
    location: {
      latitude,
      longitude,
      valid: esp32.gps_valid === true && latitude !== null && longitude !== null,
    },
    readings: rows.map((row) => {
      const rowNpk = nestedData(row.npk);
      const rowEsp32 = nestedData(row.esp32);
      return {
        timestamp: new Date(row.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
        nitrogen: numeric(rowNpk.nitrogen_mg_kg),
        phosphorus: numeric(rowNpk.phosphorus_mg_kg),
        potassium: numeric(rowNpk.potassium_mg_kg),
        moisture: numeric(rowNpk.moisture_pct),
        temperature: numeric(rowNpk.temperature_c),
        humidity: numeric(rowEsp32.humidity_pct),
        pressure: numeric(rowEsp32.pressure_hpa),
        rainfall: numeric(rowEsp32.rain_intensity_estimate_mm_h),
        airQuality: numeric(rowEsp32.mq5_aqi_estimate),
        ph: numeric(rowNpk.ph),
      };
    }),
  };
}

async function fetchSoilData(signal: AbortSignal) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase environment variables are not configured.");
  }

  const params = new URLSearchParams({
    select: "id,device_id,created_at,npk,esp32",
    order: "created_at.desc",
    limit: "20",
  });
  const response = await fetch(`${SUPABASE_URL}/rest/v1/sensor_data?${params}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    signal,
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Supabase request failed with status ${response.status}.`);
  }
  return mapSensorRows(await response.json() as SensorRow[]);
}

async function loadSharedData() {
  requestController?.abort();
  requestController = new AbortController();
  try {
    sharedData = await fetchSoilData(requestController.signal);
    sharedLastUpdated = new Date();
    listeners.forEach((listener) => listener());
  } catch (error) {
    if (error instanceof Error && error.name !== "AbortError") {
      console.error("Unable to load soil data from Supabase.", error);
    }
  }
}

function startPolling() {
  if (pollTimer) return;
  loadSharedData();
  pollTimer = setInterval(loadSharedData, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (listeners.size > 0) return;
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  requestController?.abort();
  requestController = null;
}

export function useSoilData() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    const listener = () => forceUpdate((value) => value + 1);
    listeners.add(listener);
    startPolling();
    return () => {
      listeners.delete(listener);
      stopPolling();
    };
  }, []);

  return { data: sharedData, lastUpdated: sharedLastUpdated };
}
