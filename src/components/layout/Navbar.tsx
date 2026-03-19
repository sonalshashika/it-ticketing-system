"use client";

import { useAuth } from "@/context/AuthContext";
import { UserCircle } from "lucide-react";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <nav className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xl">
          IT
        </div>
        <span className="hidden md:inline-block text-lg font-semibold text-gray-900">
          SupportDesk
        </span>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-sm font-medium text-gray-900">{user.name}</span>
              <span className="text-xs text-gray-500">{user.role}</span>
            </div>
            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
              <UserCircle size={24} />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
