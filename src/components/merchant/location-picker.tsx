"use client";

/**
 * 🗺️ 门店定位地图组件
 * 使用 Leaflet (CDN) + OpenStreetMap
 * 支持点击选点 + 显示当前位置
 */

import { useEffect, useRef } from "react";

interface LocationPickerProps {
  latitude: string;
  longitude: string;
  storeName: string;
  onLocationChange?: (lat: string, lng: string) => void;
  interactive?: boolean;
  height?: number;
}

export default function LocationPicker({
  latitude,
  longitude,
  storeName,
  onLocationChange,
  interactive = false,
  height = 200,
}: LocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const initializedRef = useRef(false);

  const lat = parseFloat(latitude) || 39.9042;
  const lng = parseFloat(longitude) || 116.4074;
  const hasCoords = !!(latitude && longitude && parseFloat(latitude) !== 0);

  useEffect(() => {
    if (!mapRef.current || initializedRef.current) return;
    initializedRef.current = true;

    const L = (window as any).L;
    if (!L) return; // Leaflet 未加载

    const map = L.map(mapRef.current, {
      center: [lat, lng],
      zoom: hasCoords ? 15 : 12,
      zoomControl: interactive,
      attributionControl: false,
      dragging: interactive,
      scrollWheelZoom: interactive,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);

    if (hasCoords) {
      const marker = L.marker([lat, lng], {
        draggable: interactive,
      }).addTo(map);

      marker.bindPopup(
        `<b>${storeName || "我的门店"}</b><br/>${parseFloat(latitude).toFixed(4)}, ${parseFloat(longitude).toFixed(4)}`
      );

      if (interactive) {
        marker.on("dragend", () => {
          const pos = marker.getLatLng();
          onLocationChange?.(pos.lat.toFixed(6), pos.lng.toFixed(6));
        });
      }

      markerRef.current = marker;
    }

    if (interactive) {
      map.on("click", (e: any) => {
        const { lat: newLat, lng: newLng } = e.latlng;
        if (markerRef.current) {
          markerRef.current.setLatLng([newLat, newLng]);
        } else {
          const marker = L.marker([newLat, newLng], { draggable: true }).addTo(map);
          marker.bindPopup(`📍 ${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            onLocationChange?.(pos.lat.toFixed(6), pos.lng.toFixed(6));
          });
          markerRef.current = marker;
        }
        onLocationChange?.(newLat.toFixed(6), newLng.toFixed(6));
      });
    }

    // 强制刷新地图大小（父容器可能刚显示）
    setTimeout(() => map.invalidateSize(), 300);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      initializedRef.current = false;
    };
  }, []);

  // Leaflet 未加载时显示 fallback
  const fallbackUrl = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`
    : null;

  return (
    <div className="relative w-full rounded-[8px] overflow-hidden border border-gray-200" style={{ height }}>
      {/* 加载 Leaflet 脚本 */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" />

      <div ref={mapRef} className="w-full h-full" />
      {interactive && (
        <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 rounded-[6px] px-2 py-1 text-[9px] text-gray-500 shadow-sm">
          {hasCoords
            ? `拖拽标记或点击地图调整位置`
            : "点击地图设置门店位置"}
        </div>
      )}
      {hasCoords && (
        <div className="absolute top-2 right-2 z-[1000] bg-white/90 rounded-[6px] px-2 py-1 text-[9px] text-gray-600 shadow-sm">
          {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
        </div>
      )}
    </div>
  );
}
