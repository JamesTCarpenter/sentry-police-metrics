"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import type * as Leaflet from "leaflet";

export interface DensityPoint {
  latitude: number;
  longitude: number;
  total_searches: number;
}

interface HeatmapLayerProps {
  points: DensityPoint[];
}

function HeatmapLayer({ points }: HeatmapLayerProps) {
  const map = useMap();

  useEffect(() => {
    let heatLayer:
      | (Leaflet.Layer & {
          setOptions: (options: Record<string, unknown>) => void;
        })
      | undefined;
    let cancelled = false;

    async function addHeatmap() {
      try {
        const leafletModule = await import("leaflet");
        const L = leafletModule.default;

        (window as Window & { L?: typeof L }).L = L;

        await import("leaflet.heat");

        if (cancelled) return;

        const leafletWithHeat = L as typeof L & {
          heatLayer: (
            points: [number, number, number][],
            options: Record<string, unknown>
          ) => Leaflet.Layer & {
            setOptions: (options: Record<string, unknown>) => void;
          };
        };

        const heatPoints = points.map(
          (point) =>
            [
              point.latitude,
              point.longitude,
              Math.log1p(point.total_searches),
            ] as [number, number, number]
        );

        heatLayer = leafletWithHeat.heatLayer(heatPoints, {
          radius: 8,
          blur: 8,
          maxZoom: 12,
          max: Math.log1p(10685) * 2,
          minOpacity: 0.04,
          gradient: {
            0.2: "#2563eb",
            0.4: "#06b6d4",
            0.6: "#facc15",
            0.8: "#f97316",
            1.0: "#dc2626",
          },
        });

        heatLayer.addTo(map);

        const updateHeatmap = () => {
          const zoom = map.getZoom();

          if (zoom <= 9) {
            heatLayer?.setOptions({
              radius: 6,
              blur: 6,
              max: Math.log1p(10685) * 3,
              minOpacity: 0.03,
            });
          } else if (zoom <= 11) {
            heatLayer?.setOptions({
              radius: 10,
              blur: 8,
              max: Math.log1p(10685) * 2,
              minOpacity: 0.05,
            });
          } else {
            heatLayer?.setOptions({
              radius: 16,
              blur: 12,
              max: Math.log1p(10685),
              minOpacity: 0.08,
            });
          }
        };

        map.on("zoomend", updateHeatmap);
        updateHeatmap();
      } catch (error) {
        console.error("Unable to initialise heatmap:", error);
      }
    }

    addHeatmap();

    return () => {
      cancelled = true;

      if (heatLayer) {
        map.removeLayer(heatLayer);
      }
    };
  }, [map, points]);

  return null;
}

interface GeographyMapProps {
  points: DensityPoint[];
}

export default function GeographyMap({ points }: GeographyMapProps) {
  return (
    <div className="h-[520px] w-full overflow-hidden rounded-xl">
      <MapContainer
        center={[51.515, -0.105]}
        zoom={14}
        minZoom={8}
        maxZoom={18}
        scrollWheelZoom={false}
        aria-label="Map showing the approximate density of Metropolitan Police stop-and-search records"
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="grayscale"
        />

        <HeatmapLayer points={points} />
      </MapContainer>
    </div>
  );
}
