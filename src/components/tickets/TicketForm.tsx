"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createTicket, logActivity } from "@/lib/firebase/firestore";
import { TicketCategory, TicketPriority, User } from "@/types";
import toast from "react-hot-toast";

import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TicketForm() {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<TicketCategory>("Hardware");
  const [priority, setPriority] = useState<TicketPriority>("Low");

  const [requestedFor, setRequestedFor] = useState<string>("");
  const [usersList, setUsersList] = useState<User[]>([]);

  // Set default requestedFor
  useEffect(() => {
    if (user && !requestedFor) {
      setRequestedFor(user.uid);
    }
  }, [user, requestedFor]);

  // Fetch users if staff
  useEffect(() => {
    const fetchUsers = async () => {
      if (user && hasRole(["ADMIN", "IT_MANAGER", "IT_EXECUTIVE", "IT_STAFF"])) {
        try {
          const snapshot = await getDocs(collection(db, "users"));
          setUsersList(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        } catch (error) {
          console.error("Error fetching users for proxy creation:", error);
        }
      }
    };
    fetchUsers();
  }, [user, hasRole]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("You must be logged in to create a ticket");
      return;
    }

    if (!title || !description) {
      toast.error("Please fill in Title and Description");
      return;
    }

    setLoading(true);
    try {
      const actualCreator = requestedFor || user.uid;

      const newTicket = await createTicket({
        title,
        description,
        category,
        priority,
        status: "Open",
        createdBy: actualCreator,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await logActivity({
        entityType: "TICKET",
        entityId: newTicket.ticketId,
        action: "created",
        performedBy: user.uid // Always log the person who submitted the form
      });

      toast.success("Ticket created successfully!");
      router.push("/tickets/my");
    } catch (error: any) {
      console.error("Error creating ticket:", error);
      toast.error(error.message || "Failed to create ticket");
    } finally {
      setLoading(false);
    }
  };

  const isStaff = hasRole(["ADMIN", "IT_MANAGER", "IT_EXECUTIVE", "IT_STAFF"]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
      
      {isStaff && usersList.length > 0 && (
        <div className="space-y-2 pb-4 border-b border-gray-100">
          <Label htmlFor="requestedFor">Requested For (Proxy Creation)</Label>
          <select 
            id="requestedFor"
            title="Requested For"
            value={requestedFor}
            onChange={(e) => setRequestedFor(e.target.value)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {usersList.map(u => (
              <option key={u.id} value={u.id!}>
                {u.name} ({u.email}) {u.id === user?.uid ? "- [Self]" : ""}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            As IT Staff, you can create this ticket on behalf of another employee.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Ticket Title *</Label>
        <Input 
          id="title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="Brief summary of the issue"
          required 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <select 
            id="category"
            title="Ticket Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as TicketCategory)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Network">Network</option>
            <option value="Access Request">Access Request</option>
            <option value="Security">Security</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Initial Priority</Label>
          <select 
            id="priority"
            title="Ticket Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TicketPriority)}
            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Detailed description of the problem or request..."
          className="min-h-[120px]"
          required 
        />
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
        <Button variant="outline" type="button" onClick={() => router.back()} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Create Ticket"}
        </Button>
      </div>
    </form>
  );
}
