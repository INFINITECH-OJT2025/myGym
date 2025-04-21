"use client";

import React, { useState, useEffect } from "react";
import { Button, addToast } from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface ClassCheckboxProps {
  classId: number;
}

const ClassCheckbox: React.FC<ClassCheckboxProps> = ({ classId }) => {
  const [isRegistered, setIsRegistered] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Check registration status from the class_registrations endpoint.
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // Ensure your backend GET endpoint is designed to accept the show_class_id as the parameter.
    fetch(`${API_BASE}/api/class-registration/${classId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include", // if needed for your configuration
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        // Assuming that if a registration exists, either data.registered is true or data.id exists.
        if (data.registered || data.id) {
          setIsRegistered(true);
        }
      })
      .catch((error) => {
        console.error("Error fetching registration status:", error);
      });
  }, [classId]);

  // Function to join class (send POST to class_registrations endpoint)
  const handleJoin = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE}/api/class-registration`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // Now we send the proper key "show_class_id" instead of "class_id"
        body: JSON.stringify({ show_class_id: classId.toString() }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("Registration successful", data);
      setIsRegistered(true);
      addToast({
        title: "Success",
        description: "Class added in your Workout Plans",
        color: "success",
        timeout: 3000,
      });
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsConfirmOpen(false);
    }
  };

  return (
    <div>
      {isRegistered ? (
        <Button color="primary" size="sm" disabled>
          Registered
        </Button>
      ) : (
        <Button color="primary" size="sm" onPress={() => setIsConfirmOpen(true)}>
          JOIN NOW
        </Button>
      )}

      {isConfirmOpen && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className="absolute inset-0 bg-black opacity-50"
            onClick={() => setIsConfirmOpen(false)}
          />
          <div className="bg-white p-6 rounded shadow-lg relative z-10 max-w-sm w-full">
            <p className="mb-4">Do you want to join this class?</p>
            <div className="flex justify-end gap-2">
              <Button color="primary" size="sm" onPress={handleJoin}>
                Yes
              </Button>
              <Button color="danger" size="sm" onPress={() => setIsConfirmOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassCheckbox;
