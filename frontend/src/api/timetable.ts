import type {
  Departure,
  DeparturesResponse,
  ImportCSVResult,
  UpcomingDeparturesResponse,
} from "../types/timetable";

export async function fetchUpcomingDepartures(): Promise<UpcomingDeparturesResponse> {
  const res = await fetch("/api/departures/upcoming");

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as UpcomingDeparturesResponse;
}

export async function fetchAllDepartures(): Promise<Departure[]> {
  const res = await fetch("/api/departures");

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as DeparturesResponse;
  return data.departures;
}

export async function importTimetableCSV(file: File): Promise<ImportCSVResult> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/import/csv", {
    method: "POST",
    body: formData,
  });

  if (res.ok) {
    const data = (await res.json()) as { imported: number };
    return { ok: true, imported: data.imported };
  }

  // バリデーションエラーは { error, details } のJSONで返る
  try {
    const data = (await res.json()) as { error?: string; details?: string[] };
    return {
      ok: false,
      error: data.error ?? `アップロードに失敗しました (${res.status})`,
      details: data.details ?? [],
    };
  } catch {
    return {
      ok: false,
      error: `アップロードに失敗しました (${res.status} ${res.statusText})`,
      details: [],
    };
  }
}
