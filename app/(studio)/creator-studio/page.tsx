import { VideoWorkspace } from "@/components/creator-studio/video-workspace";
export const metadata = { title: "Creator Studio" };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ video?: string }>;
}) {
  const { video } = await searchParams;
  return <VideoWorkspace initialVideoId={video} />;
}
