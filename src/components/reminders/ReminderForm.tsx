"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { createReminder } from "@/lib/firebase/firestore";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ReminderFormProps {
  onSuccess?: () => void;
}

export default function ReminderForm({ onSuccess }: ReminderFormProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title || !dueDate || !dueTime) {
      toast.error("Please fill in Title, Date, and Time");
      return;
    }

    setLoading(true);
    try {
      // Create dateTime combination
      const dateTimeString = `${dueDate}T${dueTime}:00`;
      const reminderDate = new Date(dateTimeString);

      await createReminder({
        title,
        description,
        dueDate,
        reminderDateTime: reminderDate.toISOString(),
        status: "Pending",
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      toast.success("Reminder created successfully!");
      setTitle("");
      setDescription("");
      setDueDate("");
      setDueTime("");
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Error creating reminder:", error);
      toast.error(error.message || "Failed to create reminder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Task Title *</Label>
        <Input 
          id="title" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="What do you need to do?"
          required 
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="date">Due Date *</Label>
          <Input 
            id="date" 
            type="date"
            value={dueDate} 
            onChange={(e) => setDueDate(e.target.value)} 
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Due Time *</Label>
          <Input 
            id="time" 
            type="time"
            value={dueTime} 
            onChange={(e) => setDueTime(e.target.value)} 
            required 
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Notes / Description</Label>
        <Textarea 
          id="description" 
          value={description} 
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional extra details..."
          className="min-h-[80px]"
        />
      </div>

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating..." : "Add Reminder"}
      </Button>
    </form>
  );
}
