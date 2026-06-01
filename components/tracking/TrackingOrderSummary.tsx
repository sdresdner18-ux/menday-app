import { PublicTrackingOrder, formatTrackingDeadline } from "@/lib/tracking-shared";

interface Props {
  order: PublicTrackingOrder;
}

export default function TrackingOrderSummary({ order }: Props) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
        Order details
      </p>

      <dl className="mt-4 space-y-3">
        <div>
          <dt className="text-xs font-semibold text-gray-500">Project</dt>
          <dd className="text-sm font-bold text-gray-900">{order.projectType}</dd>
        </div>

        {order.color ? (
          <div>
            <dt className="text-xs font-semibold text-gray-500">Color</dt>
            <dd className="text-sm font-bold text-gray-900">{order.color}</dd>
          </div>
        ) : null}

        {order.deadline ? (
          <div>
            <dt className="text-xs font-semibold text-gray-500">Expected by</dt>
            <dd className="text-sm font-bold text-gray-900">
              {formatTrackingDeadline(order.deadline)}
            </dd>
          </div>
        ) : null}

        {order.filesExpected ? (
          <div>
            <dt className="text-xs font-semibold text-gray-500">Files</dt>
            <dd className="text-sm font-bold text-gray-900">
              We&apos;re waiting for your artwork or files
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
