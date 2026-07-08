import { useEffect, useState } from "react";

function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return now;
}

export function DateDisplay() {
  const now = useNow();

  return (
    <div className="flex items-baseline gap-1 text-2xl text-white lg:text-3xl">
      <span className="rounded-sm bg-slate-100 px-2 py-0.5 font-mono font-bold tabular-nums text-slate-900">
        {now.getFullYear()}
      </span>
      <span>年</span>
      <span className="rounded-sm bg-slate-100 px-2 py-0.5 font-mono font-bold tabular-nums text-slate-900">
        {now.getMonth() + 1}
      </span>
      <span>月</span>
      <span className="rounded-sm bg-slate-100 px-2 py-0.5 font-mono font-bold tabular-nums text-slate-900">
        {now.getDate()}
      </span>
      <span>日</span>
    </div>
  );
}

export default function Clock() {
  const now = useNow();

  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  return (
    <div className="flex items-center gap-4">
      <span className="text-2xl font-bold text-white lg:text-3xl">
        現在時刻
      </span>
      <span className="rounded-sm bg-slate-100 px-4 py-1 font-mono text-4xl font-bold tabular-nums text-slate-900 lg:text-5xl">
        {hh}:{mm}
      </span>
    </div>
  );
}
