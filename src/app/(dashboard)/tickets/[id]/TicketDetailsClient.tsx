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

  const [comments, setComments] = useState<TicketComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          const fetched = await getTicketById(ticketIdDoc);
          if (fetched) {
            setTicket(fetched);
            setNewStatus(fetched.status);
            if (fetched.assignedTo) {
              setAssignedTo(fetched.assignedTo);
            }

            // Fetch comments
            const commentsData = await getComments(ticketIdDoc);
            setComments(commentsData);
            setLoadingComments(false);
          } else {
            toast.error("Ticket not found");
            router.push("/dashboard");
            return;
          }

          // Fetch Assignees if the user has IT Roles
          if (hasRole(["ADMIN", "IT_MANAGER", "IT_EXECUTIVE", "IT_STAFF"])) {
            const snapshot = await getDocs(collection(db, "users"));
            const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            
            let allowedRoles: string[] = [];
            if (hasRole(["ADMIN", "IT_MANAGER"])) {
              allowedRoles = ["IT_MANAGER", "IT_EXECUTIVE", "IT_STAFF", "ADMIN"];
            } else if (hasRole(["IT_EXECUTIVE"])) {
              allowedRoles = ["IT_EXECUTIVE", "IT_STAFF"];
            } else if (hasRole(["IT_STAFF"])) {
              allowedRoles = ["IT_STAFF"];
            }
            
            const filtered = allUsers.filter(u => allowedRoles.includes(u.role));
            setAssignees(filtered);
          }

        } catch (error) {
          console.error("Error fetching ticket:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [user, ticketIdDoc, router, hasRole]);

  const handleUpdateStatus = async () => {
    if (!ticket || !user) return;
    setUpdating(true);
    try {
      await updateTicket(ticket.id!, { status: newStatus as any });
      await logActivity({
        entityType: "TICKET",
        entityId: ticket.ticketId,
        action: `status changed to ${newStatus}`,
        performedBy: user.uid
      });
      setTicket({ ...ticket, status: newStatus as any });
      toast.success("Status updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    } finally {
      setUpdating(false);
    }
  };

  const handleAssign = async () => {
    if (!ticket || !user) return;
    setUpdatingAssignment(true);
    try {
      await updateTicket(ticket.id!, { assignedTo: assignedTo || null });
      await logActivity({
        entityType: "TICKET",
        entityId: ticket.ticketId,
        action: assignedTo ? `assigned to ${assignedTo}` : "unassigned",
        performedBy: user.uid
      });
      setTicket({ ...ticket, assignedTo: assignedTo || undefined });
      toast.success("Ticket assigned!");
    } catch (error: any) {
      toast.error(error.message || "Failed to assign ticket");
    } finally {
      setUpdatingAssignment(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user || !ticket) return;
    setPostingComment(true);
    try {
      const commentData: Omit<TicketComment, "id" | "commentId"> = {
        ticketId: ticket.id!,
        userId: user.uid,
        userName: user.name || user.email || "User",
        userRole: user.role,
        comment: newComment,
        isInternalNote: isInternal,
        createdAt: new Date().toISOString()
      };
      
      await addComment(commentData);
      
      await logActivity({
        entityType: "TICKET",
        entityId: ticket.ticketId,
        action: isInternal ? "added an internal note" : "added a comment",
        performedBy: user.uid
      });

      const updatedComments = await getComments(ticket.id!);
      setComments(updatedComments);
      setNewComment("");
      setIsInternal(false);
      toast.success(isInternal ? "Internal note posted!" : "Comment posted!");
    } catch (error: any) {
      toast.error(error.message || "Failed to post comment");
    } finally {
      setPostingComment(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading ticket details...</div>;
  }

  if (!ticket || !user) return null;

  const isStaff = hasRole(["ADMIN", "IT_MANAGER", "IT_EXECUTIVE", "IT_STAFF"]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{ticket.title}</h1>
          <p className="text-gray-500">Ticket ID: {ticket.ticketId}</p>
        </div>
        
        {isStaff && (
          <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200">
            {ticket.assignedTo === user.uid && ticket.status === "Open" && (
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                onClick={async () => {
                  if (!user) return;
                  setNewStatus("In Progress");
                  setUpdating(true);
                  try {
                    await updateTicket(ticket.id!, { status: "In Progress" });
                    await logActivity({
                      entityType: "TICKET",
                      entityId: ticket.ticketId,
                      action: "accepted and moved to in progress",
                      performedBy: user.uid
                    });
                    setTicket({ ...ticket, status: "In Progress" });
                    setNewStatus("In Progress");
                    toast.success("Ticket accepted!");
                  } catch (e: any) {
                    toast.error(e.message || "Failed to accept ticket");
                  } finally {
                    setUpdating(false);
                  }
                }}
                disabled={updating}
              >
                Accept Task
              </Button>
            )}
            <select 
              title="Ticket Status"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="h-9 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Waiting for User">Waiting for User</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <Button size="sm" onClick={handleUpdateStatus} disabled={updating || newStatus === ticket.status}>
              Update
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle>Description</CardTitle>
              <CardDescription>
                Submitted on {format(new Date(ticket.createdAt), "PPP 'at' p")}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="whitespace-pre-wrap text-gray-800 font-medium">
                {ticket.description}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity & Comments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Comment List */}
              <div className="space-y-4">
                {loadingComments ? (
                  <p className="text-sm text-center text-gray-500 py-4">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-sm text-center text-gray-500 py-4">No comments yet.</p>
                ) : (
                  comments.map((c) => (
                    <div 
                      key={c.id} 
                      className={`p-4 rounded-lg border ${
                        c.isInternalNote 
                          ? "bg-yellow-50 border-yellow-200" 
                          : "bg-gray-50 border-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-gray-900">{c.userName}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                            c.userRole === 'ADMIN' ? 'bg-red-100 text-red-700' :
                            c.userRole === 'EMPLOYEE' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {c.userRole.replace('_', ' ')}
                          </span>
                          {c.isInternalNote && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 uppercase font-bold tracking-wider">
                              Internal Note
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {format(new Date(c.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{c.comment}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <div className="pt-4 border-t border-gray-100 space-y-3">
                <Label>Add a comment</Label>
                <Textarea 
                  placeholder="Type your message here..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {isStaff ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="internal" 
                        title="Internal note"
                        checked={isInternal} 
                        onChange={(e) => setIsInternal(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="internal" className="text-sm font-medium text-gray-600 cursor-pointer">
                        Internal note (secret from user)
                      </label>
                    </div>
                  ) : <div />}
                  
                  <Button 
                    onClick={handleAddComment} 
                    disabled={!newComment.trim() || postingComment}
                    className="min-w-[120px]"
                  >
                    {postingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-500">Status</span>
                <p className="font-semibold">{ticket.status}</p>
              </div>

              {isStaff && (
                <div>
                  <span className="text-sm font-medium text-gray-500">Assigned To</span>
                  <div className="flex gap-2 mt-1">
                    <select
                      title="Assigned To"
                      value={assignedTo || ""}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="h-9 w-full rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {assignees.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.role})</option>
                      ))}
                    </select>
                    <Button size="sm" onClick={handleAssign} disabled={updatingAssignment || assignedTo === (ticket.assignedTo || "")}>
                      Save
                    </Button>
                  </div>
                </div>
              )}

              <div>
                <span className="text-sm font-medium text-gray-500">Priority</span>
                <p className="font-semibold">{ticket.priority}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Category</span>
                <p className="font-semibold">{ticket.category}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">Requester ID</span>
                <p className="font-semibold text-sm break-all">{ticket.createdBy}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
