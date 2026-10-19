import { BlogDetailPage } from "@/features/silver-platform/components";
import { getPublicBlogPost } from "@/features/silver-platform/content-api";

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <BlogDetailPage initialPost={await getPublicBlogPost(slug)} slug={slug} />;
}
