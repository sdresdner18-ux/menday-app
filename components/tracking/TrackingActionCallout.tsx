import { PublicTrackingStatus } from "@/lib/tracking-shared";

interface Props {
  status: PublicTrackingStatus;
}

export default function TrackingActionCallout({ status }: Props) {
  if (!status.actionNeeded || !status.actionMessage) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-amber-700">
        Action needed
      </p>
      <p className="mt-2 text-sm font-semibold text-amber-900">
        {status.actionMessage}
      </p>
    </div>
  );
}
