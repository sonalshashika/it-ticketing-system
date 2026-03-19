"use client";

import { useAuth } from "@/context/AuthContext";
import TicketForm from "@/components/tickets/TicketForm";

export default function NewTicketPage() {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Create New Ticket</h1>
        <p className="text-gray-500">
          Submit a new IT support request. Please provide as much detail as possible.
        </p>
      </div>
      <TicketForm />
    </div>
  );
}
