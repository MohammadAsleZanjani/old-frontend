import { redirect } from "next/navigation";

export default async function DashboardCatchAllPage({ params }: { params: Promise<{ segments?: string[] }> }) {
  const { segments = [] } = await params;
  redirect(`/user/${segments.map(encodeURIComponent).join("/")}`);
}
