"use client";

import React, { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  addToast,
} from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface AddWorkoutProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newPlan: any) => void;
  selectedDate: string;  // The date already picked by the user (e.g., "2025-04-17")
}

const AddWorkout: React.FC<AddWorkoutProps> = ({ isOpen, onClose, onAdd, selectedDate }) => {
  const [name, setName] = useState("");
  const [time, setTime] = useState(""); // Only time input now

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate both fields.
    if (!name) {
      addToast({
        title: "Error",
        description: "Name is required",
        color: "danger",
        timeout: 3000,
      });
      return;
    }
    if (!time) {
      addToast({
        title: "Error",
        description: "Time is required",
        color: "danger",
        timeout: 3000,
      });
      return;
    }

    // Combine the selected date with the time input.
    // Assumes selectedDate is in the format "YYYY-MM-DD" and time in "HH:MM".
    const schedule_time = `${selectedDate} ${time}:00`;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found. Please log in.");
        return;
      }
      const response = await fetch(`${API_BASE}/api/workout-plans`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, schedule_time }),
      });
      if (!response.ok) {
        // Directly throw an error without showing the duplicate warning.
        throw new Error("Failed to add workout plan");
      }
      const data = await response.json();
      addToast({
        title: "Success",
        description: "Workout plan added successfully!",
        color: "success",
        timeout: 3000,
      });
      onAdd(data); // Pass the newly created workout plan to the parent Dashboard.
      setName("");
      setTime("");
      onClose(); // Automatically close the add modal on success.
    } catch (error) {
      console.error("Error adding workout plan:", error);
      addToast({
        title: "Error",
        description: "Failed to add workout plan",
        color: "danger",
        timeout: 3000,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>
          <h3>Add Workout Plan</h3>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <div style={{ marginBottom: "1rem" }}>
              <label>Name: </label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div style={{ marginBottom: "1rem" }}>
              <label>Time: </label>
              <Input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="ghost" onPress={onClose}>
              Cancel
            </Button>
            <Button color="primary" type="submit">
              Add
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default AddWorkout;
