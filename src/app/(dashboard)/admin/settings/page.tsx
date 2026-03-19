"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

export default function SettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    autoAssignTickets: false,
    maintenanceMode: false
  });

  useEffect(() => {
    async function loadSettings() {
      if (!user || user.role !== "ADMIN") return;
      try {
        const docRef = doc(db, "settings", "global");
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        } else {
          // Initialize default settings in DB if they don't exist
          await setDoc(docRef, settings);
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setFetching(false);
      }
    }
    loadSettings();
  }, [user]);

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <p className="text-xl text-gray-500 font-medium">Access Denied: Administrators Only</p>
      </div>
    );
  }

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const nameInput = (document.getElementById("name") as HTMLInputElement).value;
      await updateDoc(doc(db, "users", user.uid), {
        name: nameInput,
      });
      toast.success("Profile updated successfully!");
    } catch(err) {
      toast.error("Failed to update profile.");
    }
    setLoading(false);
  };

  const handleSystemSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateDoc(doc(db, "settings", "global"), settings);
      toast.success("System preferences updated!");
    } catch(err) {
      toast.error("Failed to update settings.");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Settings</h1>
      </div>

      {fetching ? (
        <div className="text-gray-500 animate-pulse pt-10">Loading settings...</div>
      ) : (
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-sm border-gray-200 h-fit">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update your personal administrator information.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="profile-form" onSubmit={handleProfileSave} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" defaultValue={user.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue={user.email} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-500">Email addresses are tied to your authentication provider.</p>
              </div>
            </form>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-4 border-t rounded-b-xl border-gray-100">
            <Button type="submit" form="profile-form" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Saving..." : "Save Profile"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle>Global Preferences</CardTitle>
            <CardDescription>Manage application-wide system configurations.</CardDescription>
          </CardHeader>
          <CardContent>
            <form id="system-form" onSubmit={handleSystemSave} className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="space-y-1">
                  <Label className="text-base font-semibold text-gray-900">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Send an email when a new ticket is submitted.</p>
                </div>
                <input 
                  type="checkbox" 
                  title="Toggle Email Notifications"
                  checked={settings.emailNotifications}
                  onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                  className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                />
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="space-y-1">
                  <Label className="text-base font-semibold text-gray-900">Auto-assign Tickets</Label>
                  <p className="text-sm text-gray-500">Enable round-robin assignment to available IT staff.</p>
                </div>
                <input 
                  type="checkbox" 
                  title="Toggle Auto Assign Tickets"
                  checked={settings.autoAssignTickets}
                  onChange={(e) => setSettings({...settings, autoAssignTickets: e.target.checked})}
                  className="h-5 w-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500" 
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="space-y-1">
                  <Label className="text-base font-semibold text-gray-900">Maintenance Mode</Label>
                  <p className="text-sm text-gray-500">Prevent non-admins from accessing the portal.</p>
                </div>
                <input 
                  type="checkbox" 
                  title="Toggle Maintenance Mode"
                  checked={settings.maintenanceMode}
                  onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
                  className="h-5 w-5 text-red-600 rounded border-gray-300 focus:ring-red-500" 
                />
              </div>
            </form>
          </CardContent>
          <CardFooter className="bg-gray-50 px-6 py-4 border-t rounded-b-xl border-gray-100">
            <Button type="submit" form="system-form" variant="outline" disabled={loading} className="w-full sm:w-auto">
              {loading ? "Updating..." : "Update System Settings"}
            </Button>
          </CardFooter>
        </Card>
      </div>
      )}
    </div>
  );
}
