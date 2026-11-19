"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_DELIVERY_ZONES } from "@/data/deliveryZones";
import { DELIVERY_DAYS, DeliveryDayKey, DeliveryZone, DeliveryZoneInput } from "@/types/delivery";

const ZONES_KEY = "rosemary_delivery_zones";
const AREA_KEY = "rosemary_delivery_area";

interface DeliveryContextType {
  zones: DeliveryZone[];
  activeZones: DeliveryZone[];
  selectedAreaId: string | null;
  selectedZone: DeliveryZone | null;
  /** المنطقة المختارة معرّفة في لوحة التحكم كمنطقة توصيل مجاني */
  hasFreeDelivery: boolean;
  selectArea: (id: string | null) => void;
  addZone: (input: DeliveryZoneInput) => DeliveryZone;
  updateZone: (id: string, patch: Partial<DeliveryZoneInput>) => void;
  toggleZone: (id: string) => void;
  deleteZone: (id: string) => void;
}

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

function isDayKey(value: unknown): value is DeliveryDayKey {
  return typeof value === "string" && DELIVERY_DAYS.some((d) => d.key === value);
}

function parseZones(raw: string): DeliveryZone[] {
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) return DEFAULT_DELIVERY_ZONES;
  return parsed.filter(
    (z): z is DeliveryZone =>
      !!z && typeof z.id === "string" && typeof z.name === "string" &&
      Array.isArray(z.days) && typeof z.isActive === "boolean",
  ).map((z) => ({
    ...z,
    days: z.days.filter(isDayKey),
    note: typeof z.note === "string" ? z.note : undefined,
  }));
}

export function DeliveryProvider({ children }: { children: React.ReactNode }) {
  // القيم الابتدائية ثابتة على السيرفر والعميل لتفادي عدم تطابق الـ hydration.
  const [zones, setZones] = useState<DeliveryZone[]>(DEFAULT_DELIVERY_ZONES);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const savedZones = localStorage.getItem(ZONES_KEY);
      const parsedZones = savedZones ? parseZones(savedZones) : null;
      const savedArea = localStorage.getItem(AREA_KEY);
      queueMicrotask(() => {
        if (parsedZones) setZones(parsedZones);
        if (savedArea) setSelectedAreaId(savedArea);
        setIsLoaded(true);
      });
    } catch {
      queueMicrotask(() => setIsLoaded(true));
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    try { localStorage.setItem(ZONES_KEY, JSON.stringify(zones)); } catch { /* ignore */ }
  }, [zones, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      if (selectedAreaId) localStorage.setItem(AREA_KEY, selectedAreaId);
      else localStorage.removeItem(AREA_KEY);
    } catch { /* ignore */ }
  }, [selectedAreaId, isLoaded]);

  /** مزامنة التغييرات اللي بتحصل في تاب تاني (أدمن ↔ موقع) */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      try {
        if (e.key === ZONES_KEY) {
          setZones(e.newValue ? parseZones(e.newValue) : DEFAULT_DELIVERY_ZONES);
        }
        if (e.key === AREA_KEY) setSelectedAreaId(e.newValue);
      } catch { /* ignore */ }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const selectArea = useCallback((id: string | null) => setSelectedAreaId(id), []);

  const addZone = useCallback((input: DeliveryZoneInput): DeliveryZone => {
    const zone: DeliveryZone = {
      ...input,
      id: `zone-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
    };
    setZones((prev) => [...prev, zone]);
    return zone;
  }, []);

  const updateZone = useCallback((id: string, patch: Partial<DeliveryZoneInput>) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, ...patch, id: z.id } : z)));
  }, []);

  const toggleZone = useCallback((id: string) => {
    setZones((prev) => prev.map((z) => (z.id === id ? { ...z, isActive: !z.isActive } : z)));
    setSelectedAreaId((current) => {
      if (current !== id) return current;
      const zone = zones.find((z) => z.id === id);
      return zone?.isActive ? null : current;
    });
  }, [zones]);

  const deleteZone = useCallback((id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id));
    setSelectedAreaId((current) => (current === id ? null : current));
  }, []);

  const activeZones = useMemo(() => zones.filter((z) => z.isActive), [zones]);
  const selectedZone = useMemo(
    () => zones.find((z) => z.id === selectedAreaId && z.isActive) ?? null,
    [zones, selectedAreaId],
  );
  const hasFreeDelivery = !!selectedZone;

  const value = useMemo<DeliveryContextType>(() => ({
    zones, activeZones, selectedAreaId, selectedZone, hasFreeDelivery,
    selectArea, addZone, updateZone, toggleZone, deleteZone,
  }), [
    zones, activeZones, selectedAreaId, selectedZone, hasFreeDelivery,
    selectArea, addZone, updateZone, toggleZone, deleteZone,
  ]);

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDelivery() {
  const context = useContext(DeliveryContext);
  if (!context) throw new Error("useDelivery must be used within a DeliveryProvider");
  return context;
}
