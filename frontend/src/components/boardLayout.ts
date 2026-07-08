export type BoardAccent = "cyan" | "orange" | "purple";
export type BoardVariant = "bus" | "train";

export const accentBars = {
  cyan: "bg-[#206f85]",
  orange: "bg-[#b4642d]",
  purple: "bg-[#6e5590]",
} as const;

export const rowGridClasses = {
  bus: "grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_1.3fr_1fr] items-center gap-4 px-8",
  train: "grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_1.3fr] items-center gap-4 px-8",
} as const;
