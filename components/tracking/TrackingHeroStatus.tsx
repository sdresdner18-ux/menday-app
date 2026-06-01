import { PublicTrackingOrder, formatRelativeTime } from "@/lib/tracking-shared";

interface Props {
  order: PublicTrackingOrder;
}

export default function TrackingHeroStatus({ order }: Props) {
  const { currentStatus } = order;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <span
          className="mt-1.5 h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: currentStatus.color }}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Current status
          </p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900">
            {currentStatus.headline}
          </h2>
          <p className="mt-2 text-sm text-gray-600">{currentStatus.description}</p>
          <p className="mt-3 text-xs font-semibold text-gray-400">
            Updated {formatRelativeTime(order.lastUpdatedAt)}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-sm text-gray-700">
        <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold">
          {order.projectType}
        </span>
        {order.orderNumber ? (
          <span className="rounded-full bg-violet-50 px-3 py-1 font-semibold text-violet-700">
            #{order.orderNumber}
          </span>
        ) : null}
      </div>
    </div>
  );
}
