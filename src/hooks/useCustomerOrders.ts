"use client";

import { useEffect, useState } from "react";
import { Order } from "@/types";

const STORAGE_KEY = "rosemary_customer_orders";
const UPDATE_EVENT = "rosemary_customer_orders";

/** الطلبات اللي بيجهزها العملاء في الموقع، ويقرأها الأدمن في لوحة التحكم. */
export function useCustomerOrders(): Order[] {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const load = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        setOrders(raw ? JSON.parse(raw) : []);
      } catch { /* ignore */ }
    };

    queueMicrotask(load);
    window.addEventListener(UPDATE_EVENT, load);
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) load(); };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(UPDATE_EVENT, load);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return orders;
}
