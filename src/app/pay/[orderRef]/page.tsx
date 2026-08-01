import { notFound } from "next/navigation";
import { getOrderByRef } from "@/lib/queries";
import { PayClient } from "./pay-client";

export const metadata = { title: "Payment — ADAB" };

export default async function PayPage({ params }: { params: Promise<{ orderRef: string }> }) {
  const { orderRef } = await params;
  const order = await getOrderByRef(orderRef);
  if (!order) notFound();

  const bkashNumber = process.env.ADAB_BKASH_NUMBER ?? "";
  const alreadyProcessed = ["paid", "delivered", "cancelled"].includes(order.status);

  return (
    <PayClient
      orderRef={order.orderRef}
      items={order.items}
      total={order.total}
      hasPayment={order.hasPayment}
      alreadyProcessed={alreadyProcessed}
      bkashNumber={bkashNumber}
    />
  );
}
