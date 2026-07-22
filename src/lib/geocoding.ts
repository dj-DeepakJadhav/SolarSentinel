import { LocationSchema, type Location } from "@/src/domain/space-weather";

type GeocodingRecord = { id?: number; name?: string; country?: string; admin1?: string; latitude?: number; longitude?: number };

function locationId(record: GeocodingRecord) {
  return `geocode-${record.id ?? `${record.latitude}-${record.longitude}`}`;
}

export function normalizeGeocodingResults(payload: unknown): Location[] {
  const records = typeof payload === "object" && payload !== null && "results" in payload && Array.isArray(payload.results) ? payload.results as GeocodingRecord[] : [];
  return records.flatMap((record) => {
    const parsed = LocationSchema.safeParse({
      id: locationId(record),
      name: record.name,
      country: record.country ?? record.admin1 ?? "Unknown region",
      latitude: record.latitude,
      longitude: record.longitude,
    });
    return parsed.success ? [parsed.data] : [];
  });
}

export async function searchGlobalLocations(query: string): Promise<Location[]> {
  const name = query.trim().slice(0, 120);
  if (name.length < 2) return [];
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.searchParams.set("name", name);
  url.searchParams.set("count", "5");
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  const response = await fetch(url, { signal: AbortSignal.timeout(5_000), next: { revalidate: 86_400 } });
  if (!response.ok) throw new Error(`Geocoding returned ${response.status}`);
  return normalizeGeocodingResults(await response.json());
}
