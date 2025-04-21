"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import {
  Home,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  Clock,
  Dumbbell,
  Bell,
} from "lucide-react";
import { ThemeSwitch } from "@/components/theme-switch";

// Import modal components and toast function
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Checkbox,
  addToast,
} from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// Mapping for highlight colors
const colorMap: Record<string, string> = {
  default: "purple",
  primary: "#007bff",
  secondary: "#6c757d",
  success: "#28a745",
  warning: "#ffc107",
  danger: "#dc3545",
};

const colors = [
  "default",
  "primary",
  "secondary",
  "success",
  "warning",
  "danger",
];

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const notifications = 0; // Update as needed

  // For alarm logic
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [alarmEvents, setAlarmEvents] = useState<any[]>([]); // Class events for alarms
  const [workoutAlarmEvents, setWorkoutAlarmEvents] = useState<any[]>([]); // Workout plan events for alarms
  // Ref to track event IDs that have already triggered an alarm.
  const triggeredAlarmsRef = useRef<Set<number>>(new Set());
  // Ref to store the current alarm audio object.
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  const router = useRouter();

  // Unlock audio on first user interaction.
  useEffect(() => {
    const unlockAudio = () => {
      if (alarmAudioRef.current) {
        alarmAudioRef.current
          .play()
          .then(() => {
            if (alarmAudioRef.current) {
              alarmAudioRef.current.pause();
            }
            if (alarmAudioRef.current) {
              alarmAudioRef.current.currentTime = 0;
            }
          })
          .catch((err) => console.error("Audio unlock failed:", err));
        document.removeEventListener("click", unlockAudio);
      }
    };
    document.addEventListener("click", unlockAudio);
    return () => document.removeEventListener("click", unlockAudio);
  }, []);

  // Sidebar open/close state for mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/");
  };

  // Retrieve current user id from localStorage.
  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setCurrentUserId(parsedUser.id);
      } catch (error) {
        console.error("Error parsing user data:", error);
      }
    }
  }, []);

  // Persist triggered alarms in localStorage.
  const persistTriggeredAlarms = () => {
    localStorage.setItem(
      "triggeredAlarms",
      JSON.stringify(Array.from(triggeredAlarmsRef.current))
    );
  };

  // Load persisted triggered alarms on mount.
  useEffect(() => {
    const stored = localStorage.getItem("triggeredAlarms");
    if (stored) {
      try {
        const parsed = new Set<number>(JSON.parse(stored));
        triggeredAlarmsRef.current = parsed;
      } catch (error) {
        console.error("Error parsing persisted triggered alarms:", error);
      }
    }
  }, []);

  // Fetch class registrations (for class alarms) from the API.
  useEffect(() => {
    if (currentUserId === null) return;
    const fetchRegistrations = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Please log in.");
          return;
        }
        const response = await fetch(`${API_BASE}/api/class-registration`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!response.ok)
          throw new Error("Failed to fetch class registrations");
        const data = await response.json();
        console.log("Fetched registration data for alarms:", data);
        // Map registrations to alarm events with type "class"
        const calendarEvents = data
          .filter(
            (item: any) =>
              item.user_id === currentUserId &&
              item.show_class &&
              item.show_class.schedule_time &&
              item.show_class.class_data &&
              item.show_class.class_data.name
          )
          .map((item: any) => {
            const scheduleISO = item.show_class.schedule_time.replace(" ", "T");
            const eventTime = new Date(scheduleISO).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return {
              id: item.id,
              title: `${item.show_class.class_data.name} (${eventTime})`,
              start: scheduleISO,
              type: "class", // Mark as class event
            };
          });
        setAlarmEvents(calendarEvents);
      } catch (error) {
        console.error("Error fetching alarm events:", error);
      }
    };
    fetchRegistrations();
    const refreshInterval = setInterval(fetchRegistrations, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [currentUserId]);

  // Fetch workout plan events (for workout alarms) from the API.
  useEffect(() => {
    if (currentUserId === null) return;
    const fetchWorkoutAlarmEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found. Please log in.");
          return;
        }
        const response = await fetch(`${API_BASE}/api/workout-plans`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!response.ok)
          throw new Error("Failed to fetch workout plans for alarms");
        const data = await response.json();
        console.log("Fetched workout plans for alarms:", data);
        const plans = data.map((plan: any) => {
          const scheduleISO = plan.schedule_time.replace(" ", "T");
          const eventTime = new Date(scheduleISO).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });
          return {
            id: plan.id,
            title: `${plan.name} (${eventTime})`,
            start: scheduleISO,
            type: "workout", // Mark as workout event
          };
        });
        setWorkoutAlarmEvents(plans);
      } catch (error) {
        console.error("Error fetching workout alarm events:", error);
      }
    };
    fetchWorkoutAlarmEvents();
    const refreshInterval = setInterval(fetchWorkoutAlarmEvents, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, [currentUserId]);

  // Check alarms every 500ms.
  useEffect(() => {
    const checkAlarms = setInterval(() => {
      const now = new Date();
      // Combine both class and workout alarm events.
      const allAlarmEvents = [...alarmEvents, ...workoutAlarmEvents];
      for (const event of allAlarmEvents) {
        if (triggeredAlarmsRef.current.has(event.id)) continue;
        const eventTime = new Date(event.start);
        // Set alarm offset: 60 minutes for classes, 30 minutes for workout plans.
        const alarmOffset =
          event.type === "workout" ? 30 * 60 * 1000 : 60 * 60 * 1000;
        const alarmTime = new Date(eventTime.getTime() - alarmOffset);
        const diff = now.getTime() - alarmTime.getTime();
        // If within first 60 seconds after alarmTime, trigger alarm.
        if (diff >= 0 && diff < 60000) {
          playAlarm(event);
          triggeredAlarmsRef.current.add(event.id);
          persistTriggeredAlarms();
        }
      }
    }, 500);
    return () => clearInterval(checkAlarms);
  }, [alarmEvents, workoutAlarmEvents]);

  // Function to stop the alarm sound.
  const stopAlarm = () => {
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
      alarmAudioRef.current = null;
      console.log("Alarm stopped by user.");
    }
  };

  // playAlarm: Play alarm sound and display a persistent toast.
  const playAlarm = (event: any) => {
    console.log("Alarm triggered for event:", event.title);
    alarmAudioRef.current = new Audio("/Alarm.mp3"); // Make sure this path is correct.
    alarmAudioRef.current
      .play()
      .catch((error) => console.error("Error playing alarm sound:", error));
    addToast({
      title: "Event Reminder",
      description: `Your ${event.type === "workout" ? "workout" : "class"} "${event.title}" is scheduled ${
        event.type === "workout" ? "in 30 minutes" : "in one hour"
      }.`,
      color: "warning",
      timeout: 0, // Persist until manually closed.
      hideIcon: false,
      onClose: () => {
        stopAlarm();
      },
    });
  };

  return (
    <div className="relative z-50">
      {/* Hamburger menu for mobile */}
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

      {/* Mobile overlay */}
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
        <div className="p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold">Member</h2>
          <div className="relative flex items-center gap-4">
            <button className="relative">
              <Bell className="w-6 h-6" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {notifications}
                </span>
              )}
            </button>
            <ThemeSwitch />
          </div>
          {isMobile && (
            <Button variant="light" onPress={() => setIsOpen(false)}>
              <X className="w-6 h-6" />
            </Button>
          )}
        </div>
        <nav className="mt-6 space-y-3 flex-1 px-4">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
            onPress={() => {
              router.push("/membership");
              setIsOpen(false);
            }}
          >
            <Home className="w-5 h-5" /> Personal Calendar
          </Button>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
            onPress={() => {
              router.push("/membership/active");
              setIsOpen(false);
            }}
          >
            <Dumbbell className="w-5 h-5" /> Reserve Equipment &amp; Facility
          </Button>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
            onPress={() => {
              router.push("/membership/classes");
              setIsOpen(false);
            }}
          >
            <Clock className="w-5 h-5" /> Join Class
          </Button>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
            onPress={() => {
              router.push("/membership/trainer");
              setIsOpen(false);
            }}
          >
            <User className="w-5 h-5" /> Trainers
          </Button>
        </nav>
        {/* Bottom section: Settings placed above Logout */}
        <div className="p-6 space-y-3">
          <Button
            variant="ghost"
            className="w-full flex items-center justify-start gap-3 px-4 py-3 text-white hover:bg-gray-700 rounded-lg"
            onPress={() => {
              router.push("/membership/profile");
              setIsOpen(false);
            }}
          >
            <Settings className="w-5 h-5" /> Profile
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
