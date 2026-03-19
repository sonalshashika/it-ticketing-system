"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { collection, getDocs, doc, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import app, { db } from "@/lib/firebase/config";
import { logActivity } from "@/lib/firebase/firestore";
import { User, UserRole } from "@/types";
import toast from "react-hot-toast";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function UsersAdminPage() {
  const { user, hasRole } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // New User Form State
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("EMPLOYEE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    if (user && hasRole(["ADMIN", "IT_MANAGER", "IT_EXECUTIVE", "IT_STAFF"])) {
      try {
        const snapshot = await getDocs(collection(db, "users"));
        setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user, hasRole]);

  const handleUpdateRole = async (userId: string, targetRole: UserRole) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: targetRole });
      setUsers(users.map(u => (u.id === userId ? { ...u, role: targetRole } : u)));
      toast.success("User role updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail || !newPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Creating user account...");

    try {
      // 1. Initialize a secondary Firebase app to avoid signing out the current Admin
      const secondaryApp = initializeApp(app.options, `SecondaryApp_${Date.now()}`);
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Create the Auth User
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newEmail, newPassword);
      const newUid = userCredential.user.uid;

      // 3. Immediately sign out of the secondary app so no session lingers
      await signOut(secondaryAuth);

      // 4. Create the Firestore User Document under the primary app
      await setDoc(doc(db, "users", newUid), {
        name: newName,
        email: newEmail,
        role: newRole,
        department: "General", // default, could be added to form
        createdAt: serverTimestamp(),
      });

      await logActivity({
        entityType: "USER",
        entityId: newUid,
        action: `created with role ${newRole}`,
        performedBy: user!.uid
      });

      // 5. Cleanup and Refresh
      toast.success("User successfully created!", { id: toastId });
      setShowForm(false);
      setNewName("");
      setNewEmail("");
      setNewPassword("");
      setNewRole("EMPLOYEE");
      fetchUsers(); // Refresh the table
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast.error(error.message || "Failed to create user.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!loading && user && !hasRole(["ADMIN", "IT_MANAGER", "IT_EXECUTIVE", "IT_STAFF"])) {
    return <div className="p-8 text-center text-gray-500">Access Denied: IT Staff only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-gray-500">Manage employee accounts and roles.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "Add New User"}
        </Button>
      </div>

      {showForm && (
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold mb-4">Create New Account</h2>
            <form onSubmit={handleCreateUser} className="space-y-4 max-w-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name</label>
                  <Input 
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Input 
                    required
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Temporary Password</label>
                  <Input 
                    required
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 chars"
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Initial Role</label>
                  <select 
                    title="Initial Role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as UserRole)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="EMPLOYEE">Employee</option>
                    <option value="IT_STAFF">IT Staff</option>
                    <option value="IT_EXECUTIVE">IT Executive</option>
                    <option value="IT_MANAGER">IT Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              
              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                {isSubmitting ? "Creating..." : "Create User"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Email</th>
                  <th className="px-6 py-4 font-medium">Role</th>
                  <th className="px-6 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center bg-white text-gray-500 rounded-b-xl">Loading users...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-8 text-center bg-white text-gray-500 rounded-b-xl">No users found.</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id} className="border-b border-gray-100 bg-white">
                      <td className="px-6 py-4 font-medium">{u.name}</td>
                      <td className="px-6 py-4 text-gray-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <select 
                          title="Change User Role"
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id!, e.target.value as UserRole)}
                          className="px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                          disabled={!hasRole(["ADMIN", "IT_MANAGER"])} // Only Admins and Managers can change existing roles
                        >
                          <option value="EMPLOYEE">Employee</option>
                          <option value="IT_STAFF">IT Staff</option>
                          <option value="IT_EXECUTIVE">IT Executive</option>
                          <option value="IT_MANAGER">IT Manager</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => toast("User detail view is under construction")}>
                          View
                        </Button>
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
