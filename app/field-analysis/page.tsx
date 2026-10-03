"use client";

import { useMemo } from "react";
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

export default function FieldAnalysisPage() {
  const { data, lastUpdated } = useSoilData();
  const chartData = useMemo(() => data.readings, [data.readings]);
  const mapUrl = data.location.valid && data.location.latitude !== null && data.location.longitude !== null
    ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/export?bbox=${data.location.longitude - 0.01},${data.location.latitude - 0.01},${data.location.longitude + 0.01},${data.location.latitude + 0.01}&bboxSR=4326&imageSR=4326&size=1200,600&format=jpg&f=image`
    : null;

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
                <span className={`text-xs font-mono ${data.location.valid ? "text-[#eca8d6]" : "text-muted-foreground"}`}>
                  {data.location.valid ? "GPS FIX" : "NO GPS FIX"}
                </span>
              </div>
              <div className="relative min-h-[360px] bg-[#0c0d0d]">
                {mapUrl ? (
                  <img src={mapUrl} alt="Satellite imagery around the sensor location" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                ) : (
                  <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(236,168,214,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(236,168,214,.16) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
                )}
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <div className="border border-foreground/20 bg-background/90 px-8 py-7 text-center max-w-md">
                    <div className="text-3xl font-display mb-3">{data.location.valid ? "Field location active" : "GPS coordinates unavailable"}</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {data.location.valid
                        ? `${data.location.latitude?.toFixed(5)}, ${data.location.longitude?.toFixed(5)}`
                        : "The current sensor payload reports no valid GPS fix. Add latitude and longitude fields to the ESP32 payload to activate satellite imagery and QGIS layers."}
                    </p>
                  </div>
                </div>
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
