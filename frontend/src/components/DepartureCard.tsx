import type { Departure } from "../types/timetable";
import { rowGridClasses, type BoardVariant } from "./boardLayout";

interface DepartureCardProps {
  departure: Departure;
  variant: BoardVariant;
}

export default function DepartureCard({
  departure,
  variant,
}: DepartureCardProps) {
  return (
    <div
      className={`${rowGridClasses[variant]} border-b border-slate-700 py-5 last:border-b-0`}
    >
      <div className="flex min-w-0 items-center gap-5">
        {departure.note && (
          <span className="shrink-0 rounded-sm bg-slate-600 px-4 py-1 text-2xl font-bold text-white lg:text-3xl">
            {departure.note}
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate text-3xl font-bold text-white lg:text-4xl">
            {departure.routeName}
          </div>
          <div className="text-xl text-slate-400 lg:text-2xl">
            {departure.origin} 発
          </div>
        </div>
      </div>

      <div className="min-w-0 text-center">
        <div className="truncate text-3xl font-bold text-white lg:text-4xl">
          {departure.destination}
        </div>
        {variant === "bus" && departure.arrivalTime && (
          <div className="text-xl text-slate-400 lg:text-2xl">
            {departure.arrivalTime} 着
          </div>
        )}
      </div>

      <div className="text-center font-mono text-4xl font-bold tabular-nums text-white lg:text-5xl">
        {departure.departureTime}
      </div>

      {variant === "bus" && (
        <div className="text-center text-2xl text-white lg:text-3xl">
          {departure.platform ?? ""}
        </div>
      )}
    </div>
  );
}
