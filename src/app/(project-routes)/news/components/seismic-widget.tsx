"use client";

import { useEffect, useState } from "react";
import { relativeTime } from "../mock-data";

function magnitudeColor(mag: number): string {
  if (mag >= 5.0) return "text-destructive";
  if (mag >= 4.0) return "text-primary";
  return "text-muted-foreground";
}

function magnitudeBg(mag: number): string {
  if (mag >= 5.0) return "bg-destructive/10 border-destructive/30";
  if (mag >= 4.0) return "bg-primary/10 border-primary/30";
  return "bg-muted/50 border-border";
}

type USGSEvent = {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
  };
  geometry: {
    coordinates: number[]; // [longitude, latitude, depth]
  };
};

export function SeismicWidget() {
  const [, setTick] = useState(0);
  const [events, setEvents] = useState<USGSEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch from USGS API (Venezuela bounding box)
  useEffect(() => {
    async function fetchEarthquakes() {
      try {
        // Venezuela approx bounding box: minLat=0, maxLat=13, minLon=-74, maxLon=-59
        const res = await fetch(
          "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minlatitude=0&maxlatitude=13&minlongitude=-74&maxlongitude=-59&orderby=time&limit=6"
        );
        const data = await res.json();
        setEvents(data.features || []);
      } catch (err) {
        console.error("Failed to fetch seismic data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchEarthquakes();
    // Refresh every 2 minutes
    const interval = setInterval(fetchEarthquakes, 120_000);
    return () => clearInterval(interval);
  }, []);

  // Time ticker
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col">
      <div className="mb-5 flex items-center justify-between border-b border-border pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">
            Monitoreo sísmico
          </p>
          <h3 className="mt-1 font-mono text-xl font-black uppercase tracking-[-0.02em] sm:text-2xl">
            Réplicas
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-none border border-primary/30 bg-primary/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
          En vivo
        </span>
      </div>

      <div className="flex flex-col gap-px bg-border">
        {loading ? (
          <div className="bg-background p-8 text-center font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Conectando con red USGS...
          </div>
        ) : events.length === 0 ? (
          <div className="bg-background p-8 text-center font-mono text-xs uppercase tracking-[0.16em] text-muted-foreground">
            Sin actividad sísmica reciente.
          </div>
        ) : (
          events.map((event) => {
            const depth = event.geometry.coordinates[2];
            const dateStr = new Date(event.properties.time).toISOString();
            
            return (
              <a
                className="group flex items-center gap-4 bg-background p-4 transition hover:bg-card sm:p-5"
                key={event.id}
                href={`https://earthquake.usgs.gov/earthquakes/eventpage/${event.id}/executive`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {/* Magnitude circle */}
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center border font-mono text-lg font-black transition group-hover:scale-105 ${magnitudeBg(
                    event.properties.mag
                  )} ${magnitudeColor(event.properties.mag)}`}
                >
                  {event.properties.mag.toFixed(1)}
                </div>

                {/* Details */}
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate font-mono text-sm font-bold tracking-[0.02em] text-foreground transition group-hover:text-primary">
                    {event.properties.place}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70">
                    <span>Prof. {depth.toFixed(1)}km</span>
                    <span className="text-border">|</span>
                    <span>USGS ID: {event.id}</span>
                  </div>
                </div>

                {/* Time */}
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70">
                  {relativeTime(dateStr)}
                </span>
              </a>
            );
          })
        )}
      </div>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/50">
        Fuente de datos: API pública del Servicio Geológico de EE. UU. (USGS)
      </p>
    </div>
  );
}
