import { useEffect, useState } from "react";
import { fetchUpcomingDepartures } from "../api/timetable";
import type { Departure, UpcomingDeparturesResponse } from "../types/timetable";
import Clock, { DateDisplay } from "../components/Clock";
import DepartureBoard from "../components/DepartureBoard";
import NoticeTicker from "../components/NoticeTicker";

const REFRESH_INTERVAL_MS = 30_000;

// 電車はすべて大楽毛駅発として表示する
const TRAIN_STATION = "大楽毛駅";

function trainsFor(
  data: UpcomingDeparturesResponse | null,
  keywords: string[],
): Departure[] {
  return (data?.train ?? [])
    .filter((departure) =>
      keywords.some((keyword) => departure.destination.includes(keyword)),
    )
    .map((departure) => ({ ...departure, origin: TRAIN_STATION }));
}

export default function BoardPage() {
  const [data, setData] = useState<UpcomingDeparturesResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetchUpcomingDepartures();
        if (!active) return;
        setData(response);
        setErrorMessage(null);
      } catch {
        if (!active) return;
        // 前回取得したデータは残したまま、エラー表示だけ更新する
        setErrorMessage(
          "最新の情報を取得できませんでした。表示は前回取得時のものです。",
        );
      }
    };

    load();
    const timer = setInterval(load, REFRESH_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-slate-900 text-white">
      <header className="flex items-center justify-between gap-6 bg-[#33507c] px-6 py-3">
        <div className="flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white lg:h-14 lg:w-14">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-8 w-8 fill-[#33507c] lg:h-10 lg:w-10"
            >
              <path d="M12 2C7.58 2 4 2.5 4 6v9.5A2.5 2.5 0 0 0 6.5 18L5 20v1h2.23l1.5-2h6.54l1.5 2H19v-1l-1.5-2a2.5 2.5 0 0 0 2.5-2.5V6c0-3.5-3.58-4-8-4zM6 6.5h12V11H6V6.5zM7.5 14a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm9 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z" />
            </svg>
          </span>
          <h1 className="text-3xl font-bold lg:text-4xl">交通案内板</h1>
        </div>
        <div className="flex items-center gap-8">
          <DateDisplay />
          <Clock />
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <DepartureBoard
          title="バス"
          departures={data?.bus ?? []}
          accent="cyan"
          variant="bus"
        />
        <DepartureBoard
          title={`JR根室本線（${TRAIN_STATION}） 新得・音別方面`}
          departures={trainsFor(data, ["新得", "音別", "帯広"])}
          accent="orange"
          variant="train"
        />
        <DepartureBoard
          title={`JR根室本線（${TRAIN_STATION}） 釧路方面`}
          departures={trainsFor(data, ["釧路"])}
          accent="purple"
          variant="train"
        />
      </main>

      <footer className="flex items-center bg-slate-700 px-6 py-3">
        <NoticeTicker message={errorMessage} />
      </footer>
    </div>
  );
}
