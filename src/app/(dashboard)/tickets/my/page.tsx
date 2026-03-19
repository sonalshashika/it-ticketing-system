"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getTickets } from "@/lib/firebase/firestore";
import { Ticket } from "@/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function MyTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyTickets = async () => {
      if (user) {
        try {
          const fetchedTickets = await getTickets("EMPLOYEE", user.uid);
          setTickets(fetchedTickets);
        } catch (error) {
          console.error("Error fetching tickets:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchMyTickets();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">My Tickets</h1>
          <p className="text-gray-500">View and track your IT support requests.</p>
        </div>
        <Link href="/tickets/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" /> New Ticket
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Ticket ID</th>
                  <th className="px-6 py-4 font-medium">Title</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Priority</th>
                  <th className="px-6 py-4 font-medium">Created Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Loading tickets...
                    </td>
                  </tr>
                ) : tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      You have no tickets. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{ticket.ticketId}</td>
                      <td className="px-6 py-4 max-w-xs truncate">{ticket.title}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${ticket.status === 'Open' ? 'bg-blue-100 text-blue-800' : 
                            ticket.status === 'In Progress' ? 'bg-amber-100 text-amber-800' : 
                            ticket.status === 'Resolved' ? 'bg-green-100 text-green-800' : 
                            'bg-gray-100 text-gray-800'}`
                        }>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium 
                          ${ticket.priority === 'Critical' ? 'bg-red-100 text-red-800' : 
                            ticket.priority === 'High' ? 'bg-orange-100 text-orange-800' : 
                            ticket.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-gray-100 text-gray-800'}`
                        }>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {format(new Date(ticket.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/tickets/${ticket.id}`} className="text-blue-600 hover:underline font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
