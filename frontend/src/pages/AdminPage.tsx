import { useEffect, useRef, useState } from "react";
import { fetchAllDepartures, importTimetableCSV } from "../api/timetable";
import type { Departure } from "../types/timetable";

const KIND_LABELS: Record<string, string> = {
  bus: "バス",
  train: "電車",
};

export default function AdminPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [departures, setDepartures] = useState<Departure[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDepartures = async () => {
    try {
      setDepartures(await fetchAllDepartures());
      setListError(null);
    } catch {
      setListError("時刻表一覧を取得できませんでした。");
    }
  };

  useEffect(() => {
    loadDepartures();
  }, []);

  const handleUpload = async () => {
    if (!file || uploading) return;

    setUploading(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    setErrorDetails([]);

    try {
      const result = await importTimetableCSV(file);
      if (result.ok) {
        setSuccessMessage(`${result.imported}件の時刻表をインポートしました。`);
        setFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        await loadDepartures();
      } else {
        setErrorMessage(result.error);
        setErrorDetails(result.details);
      }
    } catch {
      setErrorMessage("サーバーに接続できませんでした。");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <header className="bg-[#33507c] px-6 py-4">
        <h1 className="text-2xl font-bold text-white">時刻表CSVインポート</h1>
      </header>

      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-8">
        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">CSVアップロード</h2>
          <div className="flex flex-wrap items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block text-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-300"
            />
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="rounded-md bg-[#33507c] px-6 py-2 text-sm font-medium text-white hover:bg-[#2a4268] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {uploading ? "アップロード中..." : "アップロード"}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-500">
            ※ 既存の時刻表はすべて削除され、CSVの内容で置き換えられます。
          </p>

          {successMessage && (
            <p className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
              {successMessage}
            </p>
          )}

          {errorMessage && (
            <div className="mt-4 rounded-md bg-red-50 px-4 py-3 text-sm text-red-800">
              <p className="font-medium">{errorMessage}</p>
              {errorDetails.length > 0 && (
                <ul className="mt-2 list-disc pl-5">
                  {errorDetails.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </section>

        <section className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">
            登録済み時刻表({departures.length}件)
          </h2>

          {listError && <p className="text-sm text-red-700">{listError}</p>}

          {!listError && departures.length === 0 && (
            <p className="text-sm text-slate-500">
              時刻表が登録されていません。
            </p>
          )}

          {departures.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-300 text-left text-slate-600">
                    <th className="px-3 py-2">種別</th>
                    <th className="px-3 py-2">路線名</th>
                    <th className="px-3 py-2">出発地</th>
                    <th className="px-3 py-2">行き先</th>
                    <th className="px-3 py-2">発車</th>
                    <th className="px-3 py-2">到着</th>
                    <th className="px-3 py-2">のりば</th>
                    <th className="px-3 py-2">備考</th>
                  </tr>
                </thead>
                <tbody>
                  {departures.map((departure) => (
                    <tr
                      key={departure.id}
                      className="border-b border-slate-100"
                    >
                      <td className="px-3 py-2">
                        {KIND_LABELS[departure.kind] ?? departure.kind}
                      </td>
                      <td className="px-3 py-2">{departure.routeName}</td>
                      <td className="px-3 py-2">{departure.origin}</td>
                      <td className="px-3 py-2">{departure.destination}</td>
                      <td className="px-3 py-2 tabular-nums">
                        {departure.departureTime}
                      </td>
                      <td className="px-3 py-2 tabular-nums">
                        {departure.arrivalTime ?? ""}
                      </td>
                      <td className="px-3 py-2">{departure.platform ?? ""}</td>
                      <td className="px-3 py-2">{departure.note ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
