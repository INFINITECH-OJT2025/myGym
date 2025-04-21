"use client";

import React, { useEffect, useRef } from "react";
import { addToast } from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

const AlarmManager: React.FC = () => {
  // Ref to store events (you might want to integrate this with your global state)
  const eventsRef = useRef<any[]>([]);
  // Ref to track which events have already triggered an alarm
  const triggeredAlarmsRef = useRef<Set<number>>(new Set());
  // Ref to store the current alarm audio object
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Function to stop the alarm sound.
  const stopAlarm = () => {
    if (alarmAudioRef.current) {
      alarmAudioRef.current.pause();
      alarmAudioRef.current.currentTime = 0;
      alarmAudioRef.current = null;
      console.log("Alarm stopped by user.");
    }
  };

  // playAlarm: play a sound and trigger a toast notification.
  const playAlarm = (event: any) => {
    console.log("Alarm triggered for event:", event.title);
    // Create and play alarm sound.
    alarmAudioRef.current = new Audio("/Alarm.mp3"); // Ensure the path is correct
    alarmAudioRef.current
      .play()
      .catch((error) => console.error("Error playing alarm sound:", error));

    // Show a persistent toast that the user can dismiss to stop the alarm.
    addToast({
      title: "Event Reminder",
      description: `Your event "${event.title}" is scheduled in one hour.`,
      color: "warning",
      variant: "flat",
      radius: "full",
      timeout: 0, // Persist until manually closed.
      hideIcon: false,
      onClose: () => {
        stopAlarm();
      },
    });
  };

  // Fetch events (you may integrate this with your app's global state or context)
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        if (!token || !userData) return;
        const parsedUser = JSON.parse(userData);
        const response = await fetch(`${API_BASE}/api/class-registration`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        // Filter and map events for the current user
        const calendarEvents = data
          .filter(
            (item: any) =>
              item.user_id === parsedUser.id &&
              item.class &&
              item.class.schedule_time
          )
          .map((item: any) => {
            const scheduleISO = item.class.schedule_time.replace(" ", "T");
            const eventTime = new Date(scheduleISO).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
            return {
              id: item.id,
              title: `${item.class.name} (${eventTime})`,
              start: scheduleISO,
            };
          });
        eventsRef.current = calendarEvents;
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    };

    fetchEvents();
    // Optionally, refresh events every few minutes.
    const refreshInterval = setInterval(fetchEvents, 5 * 60 * 1000);
    return () => clearInterval(refreshInterval);
  }, []);

  // Alarm check: Runs every 500ms.
  useEffect(() => {
    const checkAlarms = setInterval(() => {
      const now = new Date();
      for (const event of eventsRef.current) {
        if (triggeredAlarmsRef.current.has(event.id)) continue;
        const eventTime = new Date(event.start);
        const alarmTime = new Date(eventTime.getTime() - 60 * 60 * 1000); // one hour before
        // If event is overdue, you can handle it here (optional)
        if (eventTime < now) {
          // Handle overdue if needed.
        } else {
          // Check if current time matches alarm time (to the minute)
          if (
            alarmTime.getFullYear() === now.getFullYear() &&
            alarmTime.getMonth() === now.getMonth() &&
            alarmTime.getDate() === now.getDate() &&
            alarmTime.getHours() === now.getHours() &&
            alarmTime.getMinutes() === now.getMinutes()
          ) {
            playAlarm(event);
            triggeredAlarmsRef.current.add(event.id);
          }
        }
      }
    }, 500);
    return () => clearInterval(checkAlarms);
  }, []);

  return null;
};

export default AlarmManager;
