"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Navigation } from "@/components/landing/navigation";
import { FooterSection } from "@/components/landing/footer-section";
import { useSoilData } from "@/hooks/use-soil-data";

const chartGroups = [
  {
    title: "Soil nutrients",
    subtitle: "NPK and pH history",
    unit: "mg/kg",
    lines: [
      { key: "nitrogen", label: "Nitrogen", color: "#eca8d6" },
      { key: "phosphorus", label: "Phosphorus", color: "#9f8cff" },
      { key: "potassium", label: "Potassium", color: "#7dd3fc" },
      { key: "ph", label: "pH", color: "#f8d477" },
    ],
  },
  {
    title: "Environment",
    subtitle: "Temperature, humidity, and pressure",
    unit: "",
    lines: [
      { key: "temperature", label: "Temperature", color: "#7dd3fc" },
      { key: "humidity", label: "Humidity", color: "#eca8d6" },
      { key: "pressure", label: "Pressure", color: "#f8d477" },
    ],
  },
  {
    title: "Air and rainfall",
    subtitle: "ESP32 environmental estimates",
    unit: "",
    lines: [
      { key: "airQuality", label: "Air quality", color: "#eca8d6" },
      { key: "rainfall", label: "Rainfall", color: "#7dd3fc" },
    ],
  },
] as const;

function FieldChart({
  data,
  group,
}: {
  data: Array<Record<string, number | string | null>>;
  group: (typeof chartGroups)[number];
}) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data].reverse()} margin={{ top: 12, right: 12, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
          <XAxis dataKey="timestamp" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} tickLine={false} axisLine={false} width={42} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--background))", border: "1px solid rgba(255,255,255,0.16)", borderRadius: 0, color: "hsl(var(--foreground))", fontFamily: "var(--font-mono)", fontSize: 12 }}
            formatter={(value, name) => [value === null || value === undefined ? "—" : `${value}${group.unit ? ` ${group.unit}` : ""}`, group.lines.find((line) => line.key === name)?.label ?? name]}
          />
          {group.lines.map((line) => (
            <Line key={line.key} type="monotone" dataKey={line.key} name={line.key} stroke={line.color} strokeWidth={2} dot={{ r: 2, fill: line.color, strokeWidth: 0 }} activeDot={{ r: 4 }} connectNulls={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function value(value: number | null, suffix = "") {
  return value === null ? "—" : `${value}${suffix}`;
}

type BrowserLocation = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export default function FieldAnalysisPage() {
  const { data, lastUpdated } = useSoilData();
  const [browserLocation, setBrowserLocation] = useState<BrowserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState("Requesting browser GPS");
  const chartData = useMemo(() => data.readings, [data.readings]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus("Browser GPS unavailable");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setBrowserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
        setLocationStatus("BROWSER GPS FIX");
      },
      () => setLocationStatus("Location permission required"),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 15_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const location = browserLocation;
  const mapUrl = location
    ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}&bboxSR=4326&imageSR=4326&size=1200,600&format=jpg&f=image`
    : null;
  const qgisWmsUrl = location
    ? `https://ows.terrestris.de/osm/service?SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=OSM-WMS&STYLES=&SRS=EPSG:4326&WIDTH=1200&HEIGHT=600&FORMAT=image/png&BBOX=${location.longitude - 0.01},${location.latitude - 0.01},${location.longitude + 0.01},${location.latitude + 0.01}`
    : null;
  const arcgisViewerUrl = location
    ? `https://www.arcgis.com/home/webmap/viewer.html?center=${location.longitude},${location.latitude}&level=15`
    : "https://www.arcgis.com/home/webmap/viewer.html";

  const downloadQgisGeoJson = () => {
    if (!location) return;
    const geoJson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        properties: { source: "Mrittika browser GPS", accuracy_m: location.accuracy },
        geometry: { type: "Point", coordinates: [location.longitude, location.latitude] },
      }],
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(geoJson, null, 2)], { type: "application/geo+json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "mrittika-field-location.geojson";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navigation />
      <section className="relative pt-40 pb-20 lg:pt-48">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground mb-6">
            <span className="w-12 h-px bg-foreground/20" />
            Field analysis
          </div>
          <div className="grid lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-8">
              <h1 className="text-6xl md:text-7xl lg:text-[120px] font-display tracking-tight leading-[0.9]">
                Map the
                <br />
                <span className="text-muted-foreground">field.</span>
              </h1>
            </div>
            <div className="lg:col-span-4 text-muted-foreground text-lg leading-relaxed">
              Sensor history, spatial context, satellite imagery, and field weather in the same Mrittika workspace.
            </div>
          </div>

          <div className="grid lg:grid-cols-12 gap-6 mt-20">
            <div className="lg:col-span-8 border border-foreground/10 bg-foreground/[0.02] overflow-hidden">
              <div className="p-6 lg:p-8 border-b border-foreground/10 flex justify-between gap-4">
                <div>
                  <div className="text-lg">QGIS field context</div>
                  <div className="text-xs font-mono text-muted-foreground mt-1">GPS-linked satellite layer</div>
                </div>
                <span className={`text-xs font-mono ${location ? "text-[#eca8d6]" : "text-muted-foreground"}`}>
                  {locationStatus}
                </span>
              </div>
              <div className="relative min-h-[360px] bg-[#0c0d0d]">
                {mapUrl ? (
                  <img src={mapUrl} alt="Satellite imagery around the browser GPS location" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                ) : (
                  <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(236,168,214,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(236,168,214,.16) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
                )}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="border border-foreground/20 bg-background/90 px-8 py-7 text-center max-w-md">
                    <div className="text-3xl font-display mb-3">{location ? "Browser location active" : "Waiting for browser GPS"}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {location
                        ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)} · ±${Math.round(location.accuracy)} m`
                        : "Allow location access in the browser. This map uses the browser GPS position, not coordinates from the sensor payload."}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 lg:p-8 flex flex-wrap gap-3 border-t border-foreground/10">
                <a href={arcgisViewerUrl} target="_blank" rel="noreferrer" className="px-4 py-2 border border-foreground/20 text-xs font-mono hover:bg-foreground/10 transition-colors">
                  Open ArcGIS
                </a>
                <a href={qgisWmsUrl ?? "#"} target="_blank" rel="noreferrer" className={`px-4 py-2 border border-foreground/20 text-xs font-mono hover:bg-foreground/10 transition-colors ${!qgisWmsUrl ? "pointer-events-none opacity-40" : ""}`}>
                  Preview QGIS WMS
                </a>
                <button type="button" onClick={downloadQgisGeoJson} disabled={!location} className="px-4 py-2 border border-foreground/20 text-xs font-mono hover:bg-foreground/10 transition-colors disabled:opacity-40">
                  Download QGIS GeoJSON
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 border border-foreground/10 bg-foreground/[0.02] p-6 lg:p-8">
              <div className="text-lg mb-1">Field weather</div>
              <div className="text-xs font-mono text-muted-foreground mb-8">Current ESP32 observations</div>
              <div className="space-y-0">
                {[
                  ["Air temperature", value(data.environment.temperature, "°C")],
                  ["Humidity", value(data.environment.humidity, "%")],
                  ["Pressure", value(data.environment.pressure, " hPa")],
                  ["Rainfall estimate", value(data.environment.rainfall, " mm/h")],
                  ["Air quality estimate", value(data.environment.airQuality)],
                ].map(([label, reading]) => (
                  <div key={label} className="flex items-center justify-between gap-4 py-4 border-b border-foreground/10 text-sm">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-mono text-foreground">{reading}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 text-xs font-mono text-muted-foreground">
                {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("en-GB")}` : "Waiting for sensor update"}
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ["Soil moisture", value(data.soil.moisture, "%")],
              ["NPK sensor", data.devices.npkSensor],
              ["Pump relay", data.water.pumpStatus],
              ["Samples", `${data.readings.length} loaded`],
            ].map(([label, reading]) => (
              <div key={label} className="border border-foreground/10 bg-foreground/[0.02] p-6">
                <div className="text-2xl lg:text-3xl font-display mb-2">{reading}</div>
                <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">{label}</div>
              </div>
            ))}
          </div>

          <div className="mt-20 flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 text-sm font-mono text-muted-foreground mb-4">
                <span className="w-12 h-px bg-foreground/20" />
                Historical sensors
              </div>
              <h2 className="text-4xl lg:text-6xl font-display">Every reading, mapped over time.</h2>
            </div>
            <span className="hidden md:block text-xs font-mono text-muted-foreground">{data.readings.length} samples loaded</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mt-10">
            {chartGroups.map((group) => (
              <div key={group.title} className="border border-foreground/10 bg-foreground/[0.02] p-6 lg:p-8">
                <div className="flex flex-wrap justify-between gap-4 mb-6">
                  <div>
                    <div className="text-lg">{group.title}</div>
                    <div className="text-xs font-mono text-muted-foreground mt-1">{group.subtitle}</div>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] font-mono text-muted-foreground">
                    {group.lines.map((line) => <span key={line.key} style={{ color: line.color }}>{line.label}</span>)}
                  </div>
                </div>
                {chartData.length > 0 ? <FieldChart data={chartData} group={group} /> : <div className="h-64 flex items-center justify-center text-sm font-mono text-muted-foreground">Waiting for historical samples</div>}
              </div>
            ))}
          </div>
        </div>
      </section>
      <FooterSection />
    </main>
  );
}
