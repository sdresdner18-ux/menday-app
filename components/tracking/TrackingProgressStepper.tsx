import {
  PublicTrackingStatus,
  TRACKING_STEPPER_STEPS,
} from "@/lib/tracking-shared";

interface Props {
  currentStatus: PublicTrackingStatus;
}

export default function TrackingProgressStepper({ currentStatus }: Props) {
  const activeIndex = TRACKING_STEPPER_STEPS.findIndex(
    (step) => step.id === currentStatus.stepperStepId
  );

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
        Progress
      </p>

      <ol className="mt-5 grid grid-cols-4 gap-2">
        {TRACKING_STEPPER_STEPS.map((step, index) => {
          const isComplete = index < activeIndex;
          const isCurrent = index === activeIndex;

          return (
            <li key={step.id} className="text-center">
              <div
                className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full text-xs font-extrabold ${
                  isComplete
                    ? "bg-emerald-500 text-white"
                    : isCurrent
                      ? "bg-violet-600 text-white"
                      : "bg-gray-100 text-gray-400"
                }`}
              >
                {isComplete ? "✓" : index + 1}
              </div>
              <p
                className={`mt-2 text-[11px] font-bold leading-tight ${
                  isCurrent ? "text-violet-700" : "text-gray-500"
                }`}
              >
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
