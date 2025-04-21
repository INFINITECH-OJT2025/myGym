"use client";

import Sidebar from "@/components/sidebar";
import { useState, useEffect } from "react";
import TriggerModal from "@/components/trigger_modal";

export default function Dashboard() {
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
    <div className="flex">
      {/* Sidebar Component */}
      <Sidebar />
      <TriggerModal />

      {/* Content Area (Shifts right on desktop, full width on mobile) */}
      <div
        className={`flex-1 p-5 transition-all duration-300 ${!isMobile ? "ml-72" : ""}`}
      >
        <h1 className="text-2xl font-bold">User</h1>
        <p className="text-gray-600 mt-2">Dashboard.</p>

      </div>
    </div>
    </>
  );
}
