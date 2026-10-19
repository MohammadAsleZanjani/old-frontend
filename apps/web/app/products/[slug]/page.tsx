import { ProductDetailPage } from "@/features/public-site/pages/ProductDetailPage";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetailPage slug={slug} />;
}
