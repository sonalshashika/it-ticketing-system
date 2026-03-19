"use client";


import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { getTicketById, updateTicket, logActivity, getComments, addComment } from "@/lib/firebase/firestore";
import { Ticket, User, TicketComment } from "@/types";
import toast from "react-hot-toast";


import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";


import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


  
export function generateStaticParams() {
    return [];
}


export default function TicketDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user, hasRole } = useAuth();
  
  // Unwrapping params using React.use() as per Next.js 15+ patterns
  const resolvedParams = use(params);
  const ticketIdDoc = resolvedParams.id;
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  
  const [assignees, setAssignees] = useState<User[]>([]);
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [updatingAssignment, setUpdatingAssignment] = useState(false);
