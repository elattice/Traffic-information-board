interface NoticeTickerProps {
  message: string | null;
}

export default function NoticeTicker({ message }: NoticeTickerProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center gap-4 self-stretch rounded-sm bg-slate-800 px-5">
      <span aria-hidden="true" className="text-3xl font-bold text-yellow-400">
        !
      </span>
      {message && (
        <p role="alert" className="truncate text-xl text-red-300 lg:text-2xl">
          {message}
        </p>
      )}
    </div>
  );
}
