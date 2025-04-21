"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Pusher from "pusher-js";
import { useRouter } from "next/navigation"; // Import the useRouter hook

const API_BASE ="http://127.0.0.1:8000";

export default function TriggerModal() {
  interface User {
    id: number;
    name: string;
  }
  
  const [fetchedUser, setFetchedUser] = useState<User | null>(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter(); // Initialize router

  // Log when modal state changes
  useEffect(() => {
    console.log(`🟢 Modal is now ${isOpen ? "OPEN" : "CLOSED"}`);
  }, [isOpen]);

  // Fetch User from API (Once on Mount)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("🔑 Token Retrieved:", token);

        if (!token) {
          console.warn("⚠️ No authentication token found.");
          return;
        }

        const response = await axios.get<User>(`${API_BASE}/api/user`, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });

        if (!response.data || !response.data.id) {
          console.error("❌ Invalid user data received:", response.data);
          return;
        }

        console.log("✅ User fetched:", response.data);
        setFetchedUser({
          id: response.data.id,
          name: response.data.name,
        });
      } catch (error) {
        console.error("❌ Error fetching user:", error.message || error);
      }
    };

    fetchUser();
  }, []);

  // Listen for Payment Confirmation via Pusher (Only when user is set)
  useEffect(() => {
    if (!fetchedUser) return;

    console.log("✅ Listening for Pusher events for user ID:", fetchedUser.id);

    const pusher = new Pusher("e778dcb6c14437ec4ad9", {
      cluster: "ap1",
    });

    const channel = pusher.subscribe("notifications");

    interface EventData {
      user_id: number;
      status: string;
    }

    const handleEvent = (data: EventData) => {
      console.log("🔔 Event Received:", data);

      if (data.user_id === fetchedUser?.id && data.status === "completed") {
      console.log("✅ Matching event found, opening modal...");
      setNotificationMessage(
        `Hello ${fetchedUser.name}! Your payment has been confirmed. ✅`
      );
      setIsOpen(true); // Open modal
      } else {
      console.log("⚠️ Event ignored: Different user or status not 'completed'");
      }
    };

    channel.bind("PopupTrigger", handleEvent);

    return () => {
      console.log("❌ Unsubscribing from Pusher");
      channel.unbind("PopupTrigger", handleEvent);
      channel.unsubscribe();
    };
  }, [fetchedUser]);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 transition-all transform scale-100 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-green-600">🎉 Payment Confirmed!</h2>
            <p className="mt-2 text-gray-700">
              {notificationMessage || "Your payment has been confirmed!"}
            </p>
            <button
              onClick={() => {
                console.log("🔴 Closing Modal and redirecting...");
                setIsOpen(false);
                router.push("/membership"); // Redirect to the membership page
              }}
              className="mt-4 w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
}
