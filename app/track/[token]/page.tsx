import TrackingPageClient from "@/components/tracking/TrackingPageClient";

export const dynamic = "force-dynamic";

interface Props {
  params: { token: string };
}

export default function TrackOrderPage({ params }: Props) {
  return <TrackingPageClient token={params.token} />;
}
