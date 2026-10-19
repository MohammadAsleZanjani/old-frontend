import { BlogPage } from "@/features/silver-platform/components";
import { getPublicBlogPosts } from "@/features/silver-platform/content-api";

export default async function Page() {
  return <BlogPage initialPosts={await getPublicBlogPosts()} />;
}
