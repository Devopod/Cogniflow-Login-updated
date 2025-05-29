import { useRoute } from "wouter";
import { InvoiceDetailPage } from "@/components/finance/invoice-detail-page";

export default function InvoiceDetailsPage() {
  const [, params] = useRoute("/finance/invoices/:id");
  const invoiceId = params?.id ? parseInt(params.id) : null;
  
  return <InvoiceDetailPage invoiceId={invoiceId} />;
}