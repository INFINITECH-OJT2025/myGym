"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import {
  Home,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Bell,
  PhilippinePeso,
  SquareUser,
  MonitorCog,
  ScrollText,
  LayoutDashboard,
} from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isReservationOpen, setReservationOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAccOpen, setIsAccOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const notifications = 0; // Define notifications variable with an initial value

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
    <div className="relative z-50">
      {/* Hamburger Menu Button (Mobile Only) */}
      {isMobile && !isOpen && (
        <div className="fixed top-5 left-5 z-50">
          <Button
            variant="solid"
            color="primary"
            onPress={() => setIsOpen(true)} // Open Sidebar
          >
            <Menu className="w-6 h-6" />
          </Button>
        </div>
      )}

      {/* Overlay (Mobile) */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(true)} // Close Sidebar when clicking the overlay
        />
      )}

      {/* Sidebar */}
      <div
        className={`h-screen bg-blue-900 text-white w-72 flex flex-col transition-transform duration-300 
        ${isMobile ? `fixed top-0 left-0 z-[40] ${isOpen ? "translate-x-0" : "-translate-x-72"}` : "fixed left-0 top-0 h-screen"}`}
      >
        {/* Sidebar Header */}
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Admin</h2>

          <div className="relative flex items-center gap-4">
            {/* Notification Icon with Badge */}
            <button className="relative">
              <Bell className="w-6 h-6" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {notifications}
                </span>
              )}
            </button>

            {/* Theme Switcher */}
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
              router.push("/admin");
              setIsOpen(false);
            }}
          >
            <LayoutDashboard /> Dashboard
          </Button>
          <div className="relative">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-blue-800 rounded-lg"
              onPress={() => setIsPaymentOpen(!isPaymentOpen)}
            >
              <div className="flex items-center gap-2">
                <PhilippinePeso />
                <span>Payment Management</span>
              </div>
              {isPaymentOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
            {isPaymentOpen && (
              <div className="ml-6 mt-2 space-y-2">
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/method");
                    setIsOpen(false);
                  }}
                >
                  Payment Method
                </Button>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/paid");
                    setIsOpen(false);
                  }}
                >
                  Subscription
                </Button>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/personal");
                    setIsOpen(false);
                  }}
                >
                  Personal Trainer
                </Button>
              </div>
            )}
          </div>
          <div className="relative">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
              onPress={() => setIsAccOpen(!isAccOpen)}
            >
              <div className="flex items-center gap-2">
                <SquareUser /> <span>Accounts Management</span>
              </div>
              {isAccOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>
            {isAccOpen && (
              <div className="ml-6 mt-2 space-y-2">
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/accounts");
                    setIsOpen(false);
                  }}
                >
                  Accounts
                </Button>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/active");
                    setIsOpen(false);
                  }}
                >
                  Active Accounts
                </Button>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/expired");
                    setIsOpen(false);
                  }}
                >
                  Expired Accounts
                </Button>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/canceled");
                    setIsOpen(false);
                  }}
                >
                  Canceled Accounts
                </Button>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/trainers");
                    setIsOpen(false);
                  }}
                >
                  Trainer
                </Button>
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
              onPress={() => setIsManagementOpen(!isManagementOpen)}
            >
              <div className="flex items-center gap-2">
                <MonitorCog />
                <span>Local Management</span>
              </div>
              {isManagementOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>

            {isManagementOpen && (
              <div className="ml-6 mt-2 space-y-2">
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/rewards");
                    setIsOpen(false);
                  }}
                >
                  Rewards
                </Button>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/classes");
                    setIsOpen(false);
                  }}
                >
                  Class & Class Types
                </Button>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/facility");
                    setIsOpen(false);
                  }}
                >
                  Facility & Equipment
                </Button>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/schedule");
                    setIsOpen(false);
                  }}
                >
                  Scheduled Classes
                </Button>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/subscription");
                    setIsOpen(false);
                  }}
                >
                  Subscription
                </Button>
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
              onPress={() => setReservationOpen(!isReservationOpen)}
            >
              <div className="flex items-center gap-2">
                <ScrollText /> <span>Reservation</span>
              </div>
              {isAccOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </Button>

            {isReservationOpen && (
              <div className="ml-6 mt-2 space-y-2">
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/reservation/classes");
                    setIsOpen(false);
                  }}
                >
                  Classes
                </Button>

                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
                  onPress={() => {
                    router.push("/admin/reservation/facility");
                    setIsOpen(false);
                  }}
                >
                  Facility & Equipment
                </Button>
              </div>
            )}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-6 space-y-3">
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
