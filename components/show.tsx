"use client";

import axios from "axios";
import { addToast } from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// Utility function that converts a Date object to MySQL datetime format "YYYY-MM-DD HH:MM:SS"
const formatDateTime = (date: Date): string => {
  const pad = (num: number): string => num.toString().padStart(2, "0");
  return (
    date.getFullYear() +
    "-" +
    pad(date.getMonth() + 1) +
    "-" +
    pad(date.getDate()) +
    " " +
    pad(date.getHours()) +
    ":" +
    pad(date.getMinutes()) +
    ":" +
    pad(date.getSeconds())
  );
};

interface ClassItem {
  id: number;
  schedule_time?: string;
}

const recordShow = async (classItem: ClassItem) => {
  try {
    // Use the provided schedule_time (or fall back to current time if not set)
    const scheduleInput = classItem.schedule_time
      ? new Date(classItem.schedule_time)
      : new Date();
    const formattedScheduleTime = formatDateTime(scheduleInput);

    const payload = {
      class_id: classItem.id,
      status: "show", // Allowed values: "show", "archived"
      schedule_time: formattedScheduleTime,
    };

    await axios.post(`${API_BASE}/api/show_classes`, payload, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    
    addToast({
      title: "Success",
      description: "Successfully added the scheduled class",
      color: "success",
      variant: "flat",
      radius: "full",
      timeout: 3000,
      hideIcon: true,
    });
    console.log("Show class recorded successfully");
    return true;
  } catch (error: any) {
    console.error("Error recording show class:", error);
    // Check if the error status is 409 Conflict (duplicate)
    if (error.response && error.response.status === 409) {
      addToast({
        title: "Failed",
        description: "This class is already scheduled at this time.",
        color: "danger",
        variant: "flat",
        radius: "full",
        timeout: 3000,
        hideIcon: true,
      });
    } else {
      addToast({
        title: "Failed",
        description: "An error occurred while scheduling the class.",
        color: "danger",
        variant: "flat",
        radius: "full",
        timeout: 3000,
        hideIcon: true,
      });
    }
    return false;
  }
};

export default recordShow;
