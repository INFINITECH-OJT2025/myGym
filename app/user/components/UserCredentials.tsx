"use client";

import { useEffect, useState } from "react";
import { Input } from "@heroui/react";
import axios from "axios";
import { format } from "date-fns";

const API_BASE = "http://127.0.0.1:8000";

export default function UserCredentials() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await axios.get(`${API_BASE}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold">👤 User Information</h2>

      {user ? (
        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
          <label className="block text-gray-700 font-medium">Full Name</label>
          <Input value={user.name || "N/A"} disabled className="mb-2" />

          <label className="block text-gray-700 font-medium">Email</label>
          <Input value={user.email || "N/A"} disabled className="mb-2" />

          <label className="block text-gray-700 font-medium">Contact Number</label>
          <Input value={user.contact_number || "N/A"} disabled className="mb-2" />

          <label className="block text-gray-700 font-medium">Birthday</label>
          <Input
            value={
              user.birthday && !isNaN(Date.parse(user.birthday))
                ? format(new Date(user.birthday), "MMMM d, yyyy")
                : "No Birthday Provided"
            }
            disabled
            className="mb-2"
          />

          <label className="block text-gray-700 font-medium">Address</label>
          <Input value={user.address || "N/A"} disabled className="mb-2" />
        </div>
      ) : (
        <p className="text-gray-600">Loading user details...</p>
      )}
    </div>
  );
}
