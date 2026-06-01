import { PublicStatusHistoryEntry, formatRelativeTime } from "@/lib/tracking-shared";

interface Props {
  history: PublicStatusHistoryEntry[];
}

export default function PublicStatusTimeline({ history }: Props) {
  if (history.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
          Updates
        </p>
        <p className="mt-3 text-sm text-gray-500">No updates yet.</p>
      </div>
    );
  }

  const entries = [...history].reverse();

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
        Updates
      </p>

      <ol className="relative mt-5 space-y-0 border-l-2 border-violet-100 pl-5">
        {entries.map((entry, index) => (
          <li key={entry.id} className="relative pb-5 last:pb-0">
            <span
              className={`absolute -left-[1.35rem] top-1 h-3 w-3 rounded-full border-2 border-white ${
                index === 0 ? "bg-violet-600" : "bg-gray-300"
              }`}
            />
            <p className="text-sm font-bold text-gray-900">{entry.headline}</p>
            <p className="text-xs text-gray-500">
              {formatRelativeTime(entry.createdAt)}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
