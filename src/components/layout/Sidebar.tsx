"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Menu, X, Ticket, LayoutDashboard, 
  Clock, Users, Settings, LogOut 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "IT_MANAGER", "IT_EXECUTIVE", "IT_STAFF", "EMPLOYEE"] },
    { name: "My Tickets", href: "/tickets/my", icon: Ticket, roles: ["ADMIN", "IT_MANAGER", "IT_EXECUTIVE", "IT_STAFF", "EMPLOYEE"] },
    { name: "All Tickets", href: "/tickets/all", icon: Ticket, roles: ["ADMIN", "IT_MANAGER", "IT_EXECUTIVE", "IT_STAFF"] },
    { name: "Reminders", href: "/reminders", icon: Clock, roles: ["ADMIN", "IT_MANAGER", "IT_EXECUTIVE", "IT_STAFF", "EMPLOYEE"] },
    { name: "Users", href: "/admin/users", icon: Users, roles: ["ADMIN", "IT_MANAGER", "IT_EXECUTIVE", "IT_STAFF"] },
    { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["ADMIN"] },
  ];

  const filteredNav = navigation.filter(item => 
    user && hasRole(item.roles as any)
  );

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed bottom-4 right-4 z-50">
        <Button size="icon" className="rounded-full shadow-lg h-14 w-14" onClick={toggleMobile}>
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </Button>
      </div>

      {/* Sidebar Content */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 transform bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex h-full flex-col px-3 py-4">
          <div className="space-y-1 mt-4">
            {filteredNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`
                    group flex items-center rounded-lg p-2 text-sm font-medium
                    ${isActive 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"}
                  `}
                >
                  <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${isActive ? "text-blue-700" : "text-gray-500 group-hover:text-gray-900"}`} />
                  {item.name}
                </Link>
              );
            })}
          </div>

          <div className="mt-auto pt-4 border-t border-gray-200">
            <button
              onClick={() => logout()}
              className="group flex w-full items-center rounded-lg p-2 text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0 text-red-500 group-hover:text-red-600" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-30 bg-gray-900/50 md:hidden" 
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
