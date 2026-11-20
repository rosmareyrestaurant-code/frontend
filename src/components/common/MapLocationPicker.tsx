"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, MapPinned, CheckCircle2 } from "lucide-react";
import type { Map as LeafletMap, Marker } from "leaflet";
import "leaflet/dist/leaflet.css";
import { reverseGeocode } from "@/lib/geocode";
import { useStoreToast } from "@/components/common/StoreToast";

export interface MapPickedLocation {
  lat: number;
  lng: number;
  address: string;
}

interface MapLocationPickerProps {
  open: boolean;
  initial?: { lat?: number; lng?: number };
  onClose: () => void;
  onConfirm: (location: MapPickedLocation) => void;
}

const DEFAULT_CENTER = { lat: 30.0444, lng: 31.2357 };

const PIN_HTML =
  '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#526B58;border:3px solid #ffffff;box-shadow:0 4px 10px rgba(0,0,0,.35);transform:rotate(-45deg)"></div>';

export default function MapLocationPicker({
  open,
  initial,
  onClose,
  onConfirm,
}: MapLocationPickerProps) {
  const { showMessage } = useStoreToast();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const initialRef = useRef(initial);
  initialRef.current = initial;

  const [picked, setPicked] = useState<{ lat: number; lng: number } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolved, setResolved] = useState<string | null>(null);
  const [resolveFailed, setResolveFailed] = useState(false);
  const resolveRef = useRef<Promise<string> | null>(null);

  // فتح/غلق الموديل — إنشاء الخريطة وإزالتها
  useEffect(() => {
    if (!open) return;
    setPicked(null);
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current) return;

      const start =
        typeof initialRef.current?.lat === "number" && typeof initialRef.current?.lng === "number"
          ? { lat: initialRef.current.lat, lng: initialRef.current.lng }
          : DEFAULT_CENTER;

      const map = L.map(containerRef.current, {
        center: [start.lat, start.lng],
        zoom: 14,
        zoomControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
      }).addTo(map);

      const icon = L.divIcon({
        className: "",
        html: PIN_HTML,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });

      const placeMarker = (lat: number, lng: number) => {
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], { icon }).addTo(map);
        }
      };

      if (typeof initialRef.current?.lat === "number" && typeof initialRef.current?.lng === "number") {
        const lat = initialRef.current.lat;
        const lng = initialRef.current.lng;
        placeMarker(lat, lng);
        setPicked({ lat, lng });
      }

      map.on("click", (e) => {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        placeMarker(lat, lng);
        setPicked({ lat, lng });
      });

      // تأخير بسيط عشان الخريطة تاخد مقاسها الحقيقي بعد ظهور الموديل
      window.setTimeout(() => map.invalidateSize(), 150);
    })();

    return () => {
      cancelled = true;
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [open]);

  // تحديد العنوان النصي أول ما يتحدد مكان — عشان يظهر قبل التأكيد
  useEffect(() => {
    if (!open || !picked) {
      setResolved(null);
      setResolveFailed(false);
      setResolving(false);
      resolveRef.current = null;
      return;
    }
    let cancelled = false;
    setResolving(true);
    setResolved(null);
    setResolveFailed(false);

    const promise = reverseGeocode(picked.lat, picked.lng);
    resolveRef.current = promise;

    promise
      .then((text) => {
        if (!cancelled) setResolved(text);
      })
      .catch(() => {
        if (!cancelled) setResolveFailed(true);
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, picked]);

  // إغلاق بزر Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const confirm = async () => {
    if (!picked || confirming) return;
    setConfirming(true);
    let address = resolved;
    if (!address) {
      try {
        address = await (resolveRef.current ?? reverseGeocode(picked.lat, picked.lng));
      } catch {
        address = `${picked.lat.toFixed(5)}, ${picked.lng.toFixed(5)}`;
        showMessage("تعذّر تحويل المكان لعنوان — اكتب تفاصيل الشارع بنفسك.", "warning");
      }
    }
    onConfirm({ lat: picked.lat, lng: picked.lng, address });
    setConfirming(false);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" dir="rtl">
      <div
        className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="تحديد مكان التوصيل على الخريطة"
        className="relative w-full sm:max-w-lg bg-[#F2F2ED] border border-[#2b241e] shadow-2xl flex flex-col max-sm:rounded-t-[26px] sm:rounded-2xl overflow-hidden animate-[sheet-slide-up_280ms_cubic-bezier(0.16,1,0.3,1)]"
      >
        <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-[#dcdcd3]">
          <h3 className="flex items-center gap-2 text-sm font-black text-[#26352B]">
            <MapPinned className="h-4 w-4 text-[#526B58]" />
            حدد مكان التوصيل على الخريطة
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق الخريطة"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dcdcd3] bg-[#FFFFFF] text-[#526B58] transition-colors hover:bg-[#EFF2EA]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <div ref={containerRef} className="h-[340px] w-full sm:h-[420px]" />
          {!picked && (
            <div className="pointer-events-none absolute inset-x-3 top-3 flex justify-center">
              <span className="rounded-full bg-[#26352B]/85 px-3.5 py-1.5 text-[11px] font-bold text-[#FFFFFF] shadow-lg">
                اضغط على مكان التوصيل على الخريطة
              </span>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 border-t border-[#dcdcd3] space-y-2.5">
          {picked && (
            <div className="rounded-xl border border-[#DCDCD3] bg-[#FFFFFF] px-3.5 py-2.5">
              {resolving ? (
                <p className="flex items-center gap-2 text-[11.5px] font-bold text-[#697F6B]">
                  <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  جاري تحديد عنوان المكان...
                </p>
              ) : resolved ? (
                <p className="flex items-start gap-2 text-[11.5px] font-bold leading-relaxed text-[#26352B]">
                  <MapPinned className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#526B58]" />
                  <span>{resolved}</span>
                </p>
              ) : (
                <p className="flex items-start gap-2 text-[11.5px] font-bold leading-relaxed text-[#8a6a2f]">
                  <MapPinned className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>تعذّر قراءة اسم المكان تلقائيًا — هنحط الإحداثيات وتقدر تكتب تفاصيل الشارع بعد كده.</span>
                </p>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={confirm}
            disabled={!picked || confirming}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#526B58] px-4 py-3 text-sm font-bold text-[#FFFFFF] transition-colors hover:bg-[#465D4C] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {confirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> جاري تجهيز العنوان...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" /> تأكيد الموقع
              </>
            )}
          </button>
          <p className="text-center text-[10.5px] font-medium text-[#8a8175]">
            بعد التأكيد هيتكتب العنوان في خانة عنوان التوصيل وتقدر تعدله براحتك.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}
