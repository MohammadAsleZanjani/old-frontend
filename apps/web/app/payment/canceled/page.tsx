import { PaymentReturnPage } from "@/features/public-site/pages/PaymentReturnPage";

export default async function Page({ searchParams }: { searchParams: Promise<{ paymentId?: string }> }) {
  const { paymentId } = await searchParams;
  return <PaymentReturnPage expected="canceled" paymentId={paymentId} />;
}
