import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { Worker } from '../types/index.ts';

interface MapViewerProps {
  workers: Worker[];
  centerLat?: number;
  centerLng?: number;
  radiusKm?: number;
  onSelectWorker?: (worker: Worker) => void;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  workers,
  centerLat = 26.4960,
  centerLng = 80.2600,
  radiusKm = 5,
  onSelectWorker
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix default marker icon issues in Leaflet when bundled
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
    });

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current).setView([centerLat, centerLng], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors | Kanpur Pilot'
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    map.setView([centerLat, centerLng], 13);

    // Clear existing layer groups if needed
    // Draw customer location circle & marker
    const customerIcon = L.divIcon({
      className: 'customer-marker',
      html: `<div style="background-color: #12304A; color: white; border-radius: 50%; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">🏠</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    L.marker([centerLat, centerLng], { icon: customerIcon })
      .addTo(map)
      .bindPopup(`<b>Your Location</b><br>Kalyanpur, Kanpur`);

    // Radius circle
    L.circle([centerLat, centerLng], {
      color: '#087F5B',
      fillColor: '#087F5B',
      fillOpacity: 0.1,
      radius: radiusKm * 1000
    }).addTo(map);

    // Add Worker markers
    workers.forEach((w) => {
      const workerIcon = L.divIcon({
        className: 'worker-marker',
        html: `<div style="background-color: #087F5B; color: white; border-radius: 50%; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; box-shadow: 0 4px 8px rgba(8,127,91,0.4); border: 2px solid white;">⚡</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      const marker = L.marker([w.lat, w.lng], { icon: workerIcon }).addTo(map);
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; min-width: 160px;">
          <div style="font-weight: bold; font-size: 13px; color: #12304A;">${w.name}</div>
          <div style="color: #087F5B; font-weight: 600;">⭐ ${w.rating || '4.9'} · ${w.completedJobs} jobs</div>
          <div style="color: #64748B; font-size: 11px; margin-top: 2px;">${w.cooperativeName}</div>
          <div style="color: #475569; font-size: 11px; margin-top: 2px;">Area: ${w.area}</div>
          <div style="margin-top: 6px; padding-top: 4px; border-top: 1px solid #E2E8F0; font-size: 11px; font-weight: bold; color: ${w.isAvailable ? '#087F5B' : '#EF4444'};">
            ${w.isAvailable ? '● Available Now' : '○ Busy on Job'}
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectWorker) onSelectWorker(w);
      });
    });

    return () => {
      // Keep map instance
    };
  }, [workers, centerLat, centerLng, radiusKm]);

  return (
    <div className="w-full h-full min-h-[360px] rounded-xl overflow-hidden border border-slate-200 shadow-xs relative z-0">
      <div ref={mapContainerRef} className="w-full h-full min-h-[360px]" />
    </div>
  );
};
