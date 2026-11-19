/**
 * تحويل إحداثيات GPS لعنوان مقروء بالعربية.
 * بناءً على OpenStreetMap Nominatim، مع مهلة قصيرة وترتيب
 * للمناطق بدل عرض سلسلة `display_name` الطويلة بالإنجليزي.
 */

interface NominatimAddress {
  road?: string;
  residential?: string;
  neighbourhood?: string;
  quarter?: string;
  suburb?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
}

interface NominatimResponse {
  display_name?: string;
  address?: NominatimAddress;
}

const TIMEOUT_MS = 6000;

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      lat: String(lat),
      lon: String(lng),
      zoom: "18",
      addressdetails: "1",
      "accept-language": "ar",
    });

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?${params.toString()}`,
      { signal: controller.signal, headers: { "Accept-Language": "ar" } },
    );
    if (!res.ok) throw new Error("فشل تحديد العنوان");

    const data = (await res.json()) as NominatimResponse;
    const a = data.address ?? {};

    // أقصر عنوان ممكن: الشارع → الحي → المدينة → المحافظة
    const parts = [
      a.road ?? a.residential,
      a.neighbourhood ?? a.quarter ?? a.suburb,
      a.city ?? a.town ?? a.village,
      a.state,
    ]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .map((part) => part.trim());

    if (parts.length) return parts.join("، ");
    if (data.display_name) return data.display_name.split(",").slice(0, 3).join("،").trim();
    throw new Error("تعذّر تحديد العنوان");
  } finally {
    clearTimeout(timer);
  }
}
