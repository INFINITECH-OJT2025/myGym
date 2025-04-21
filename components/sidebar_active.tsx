"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Home, User, Settings, Menu, X, LogOut } from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <div className="flex">
      {/* Hamburger Menu Button (Mobile Only) */}
      {isMobile && (
        <div className="fixed top-5 left-5 z-50">
          <Button
            variant="solid"
            color="primary"
            onPress={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      )}

      {/* Overlay (Mobile) */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`h-screen bg-blue-900 text-white w-72 flex flex-col transition-transform duration-300 
                ${isMobile ? `fixed top-0 left-0 z-50 ${isOpen ? "translate-x-0" : "-translate-x-72"}` : "fixed left-0 top-0 h-screen"}`}
      >
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">User</h2>
          <div className="p-4 flex justify-center">
            <ThemeSwitch />
          </div>
          {isMobile && (
            <Button variant="light" onPress={() => setIsOpen(false)}>
              <X className="w-6 h-6" />
            </Button>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="mt-6 space-y-3 flex-1 px-4">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
            onPress={() => {
              router.push("/membership/active");
              setIsOpen(false);
            }}
          >
            <Home className="w-5 h-5" /> Dashboard
          </Button>

          <Button
            variant="ghost"
            className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
            onPress={() => {
              router.push("/membership/active/trainer");
              setIsOpen(false);
            }}
          >
            <User className="w-5 h-5" /> Trainers
          </Button>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
            onPress={() => {
              router.push("/settings");
              setIsOpen(false);
            }}
          >
            <Settings className="w-5 h-5" /> Settings
          </Button>
        </nav>

        {/* Logout Button */}
        <div className="p-6">
          <Button
            variant="solid"
            color="danger"
            className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white rounded-lg"
            onPress={handleLogout}
          >
            <LogOut className="w-5 h-5" /> Logout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
