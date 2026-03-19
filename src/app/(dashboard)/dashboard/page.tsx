"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ticket, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    pendingReminders: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (user) {
        try {
          // Dynamic import to avoid dependency cycle if any
          const { getTickets, getReminders } = await import('@/lib/firebase/firestore');
          
          const allTickets = await getTickets(user.role, user.uid);
          const allReminders = await getReminders(user.uid);
          
          setStats({
            totalTickets: allTickets.length,
            openTickets: allTickets.filter(t => t.status !== 'Resolved' && t.status !== 'Closed').length,
            resolvedTickets: allTickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length,
            pendingReminders: allReminders.filter(r => r.status === 'Pending').length,
          });
        } catch (error) {
          console.error("Failed to fetch dashboard stats", error);
        }
      }
    };
    fetchDashboardData();
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-gray-500">Welcome back, {user?.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTickets}</div>
            <p className="text-xs text-gray-500">All time tickets</p>
          </CardContent>
        </Card>

        {/* Open Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.openTickets}</div>
            <p className="text-xs text-gray-500">Requires attention</p>
          </CardContent>
        </Card>

        {/* Resolved Tickets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved Tickets</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.resolvedTickets}</div>
            <p className="text-xs text-gray-500">Successfully closed</p>
          </CardContent>
        </Card>

        {/* Reminders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reminders</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReminders}</div>
            <p className="text-xs text-gray-500">Upcoming tasks</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-6">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            {/* We will map the real tickets later */}
            <p className="text-sm text-gray-500">Loading recent tickets...</p>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Upcoming Reminders</CardTitle>
          </CardHeader>
          <CardContent>
            {/* We will map the real reminders later */}
            <p className="text-sm text-gray-500">Loading reminders...</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
