import TicketDetailsClient from './TicketDetailsClient';

export function generateStaticParams() {
  return [];
}

export default function TicketDetailsPage({ params }: { params: any }) {
  return <TicketDetailsClient params={params} />;
}
