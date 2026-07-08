import type { Departure } from "../types/timetable";
import DepartureCard from "./DepartureCard";
import {
  accentBars,
  rowGridClasses,
  type BoardAccent,
  type BoardVariant,
} from "./boardLayout";

interface DepartureBoardProps {
  title: string;
  departures: Departure[];
  accent: BoardAccent;
  variant: BoardVariant;
}

const emptyMessages: Record<BoardVariant, string> = {
  bus: "本日のバス表示対象はありません",
  train: "本日の電車表示対象はありません",
};

function HeaderLabel({ ja, en }: { ja: string; en: string }) {
  return (
    <div className="text-center leading-tight">
      <div className="text-xl font-bold text-slate-200 lg:text-2xl">{ja}</div>
      <div className="text-xs text-slate-400 lg:text-sm">{en}</div>
    </div>
  );
}

export default function DepartureBoard({
  title,
  departures,
  accent,
  variant,
}: DepartureBoardProps) {
  return (
    <section>
      <h2
        className={`${accentBars[accent]} px-6 py-1.5 text-2xl font-bold text-white lg:text-3xl`}
      >
        {title}
      </h2>

      {departures.length === 0 ? (
        <div className="px-6 py-5">
          <p className="rounded-lg border border-slate-700 bg-black px-8 py-8 text-center text-3xl font-bold text-slate-300 lg:text-4xl">
            {emptyMessages[variant]}
          </p>
        </div>
      ) : (
        <>
          <div
            className={`${rowGridClasses[variant]} border-b border-slate-600 py-2`}
          >
            <HeaderLabel ja="種別 / 路線名" en="Type / Route" />
            <HeaderLabel ja="行先" en="Destination" />
            <HeaderLabel ja="発車時刻" en="Dep. Time" />
            {variant === "bus" && <HeaderLabel ja="のりば" en="Platform" />}
          </div>

          {departures.map((departure) => (
            <DepartureCard
              key={departure.id}
              departure={departure}
              variant={variant}
            />
          ))}
        </>
      )}
    </section>
  );
}
