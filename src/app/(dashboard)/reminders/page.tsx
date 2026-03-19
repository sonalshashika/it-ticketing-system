"use client";

import { useEffect, useState } from "react";
import { format, isPast, parseISO } from "date-fns";
import { useAuth } from "@/context/AuthContext";
import { getReminders, updateReminderStatus } from "@/lib/firebase/firestore";
import { Reminder } from "@/types";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Clock, CheckCircle } from "lucide-react";
import ReminderForm from "@/components/reminders/ReminderForm";

export default function RemindersPage() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReminders = async () => {
    if (user) {
      try {
        const fetched = await getReminders(user.uid);
        setReminders(fetched);
      } catch (error) {
        console.error("Error fetching reminders:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadReminders();
  }, [user]);

  const handleComplete = async (reminder: Reminder) => {
    try {
      await updateReminderStatus(reminder.id!, "Completed");
      toast.success("Task marked as completed");
      loadReminders();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete task");
    }
  };

  const pendingReminders = reminders.filter(r => r.status === "Pending");
  const completedReminders = reminders.filter(r => r.status === "Completed");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Personal Tasks & Reminders</h1>
        <p className="text-gray-500">Manage your to-do lists and get notified for due tasks.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Col: Create Form */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Create Reminder</CardTitle>
            </CardHeader>
            <CardContent>
              <ReminderForm onSuccess={loadReminders} />
            </CardContent>
          </Card>
        </div>

        {/* Right Col: List */}
        <div className="md:col-span-2 space-y-6">
          {/* Pending */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Pending Tasks ({pendingReminders.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-gray-500 text-sm">Loading tasks...</p>
              ) : pendingReminders.length === 0 ? (
                <p className="text-gray-500 text-sm py-4">You have no pending tasks. Great job!</p>
              ) : (
                <div className="space-y-3">
                  {pendingReminders.map(reminder => {
                    const overDue = isPast(parseISO(reminder.reminderDateTime));
                    return (
                      <div key={reminder.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                        <div>
                          <h4 className="font-semibold text-gray-900">{reminder.title}</h4>
                          {reminder.description && (
                            <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                          )}
                          <div className={`text-xs mt-2 font-medium ${overDue ? "text-red-600" : "text-gray-500"}`}>
                            Due: {format(parseISO(reminder.reminderDateTime), "MMM d, yyyy 'at' h:mm a")}
                            {overDue && " (Overdue)"}
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleComplete(reminder)}
                          size="sm" 
                          variant="outline"
                          className="text-green-600 hover:bg-green-50 hover:text-green-700 border-green-200"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Done
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completed */}
          {completedReminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-500">
                  <CheckCircle className="h-5 w-5" />
                  Completed Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 opacity-60">
                  {completedReminders.map(reminder => (
                    <div key={reminder.id} className="flex items-start justify-between p-3 border-b last:border-0 border-gray-100">
                      <div>
                        <h4 className="font-medium text-gray-900 line-through">{reminder.title}</h4>
                        <div className="text-xs mt-1 text-gray-500">
                          Due: {format(parseISO(reminder.reminderDateTime), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
