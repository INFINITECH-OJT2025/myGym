"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";
import axios from "axios";
import { addToast } from "@heroui/react";

// ✅ API Base URL
const API_BASE = "http://127.0.0.1:8000";

// ✅ Define Props
interface AddTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => Promise<void>;
}

const AddTrainerModal: React.FC<AddTrainerModalProps> = ({
  isOpen,
  onClose,
  onUserAdded,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contact_number: "",
    birthday: "",
    address: "",
    gender: "Prefer not to say",
    password: "",
    confirm_password: "",
    specialization: "",
    availability_schedule: "", // ✅ Now a datetime-local input
    bio: "",
  });

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  // ✅ Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle form submission (Register Trainer)
  const handleSubmit = async () => {
    if (formData.password !== formData.confirm_password) {
      setError("Passwords do not match!");
      return;
    }

    setError("");
    setLoading(true);

    const token = localStorage.getItem("token"); // ✅ Correct Token Retrieval
    console.log("Token before API request:", token); // Debugging

    if (!token) {
      console.error("❌ No token found! User must log in.");
      setError("Session expired. Please log in again.");
      setLoading(false);
      return;
    }

    try {
      // ✅ Convert datetime-local to proper format: YYYY-MM-DD HH:mm:ss
      const formattedDateTime = formData.availability_schedule.replace("T", " ") + ":00";

      // ✅ Register Trainer
      await axios.post(
        `${API_BASE}/api/trainers`,
        {
          name: formData.name,
          email: formData.email,
          contact_number: formData.contact_number,
          birthday: formData.birthday,
          address: formData.address,
          gender: formData.gender,
          password: formData.password,
          password_confirmation: formData.confirm_password,
          specialization: formData.specialization,
          availability_schedule: formattedDateTime, // ✅ Send formatted datetime
          bio: formData.bio,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          withCredentials: true, // ✅ Required for Sanctum authentication
        }
      );

      console.log("✅ Trainer added successfully.");

      addToast({
        title: "Trainer Added",
        description: `Trainer ${formData.name} has been successfully registered!`,
        color: "success",
        variant: "flat",
        radius: "full",
        timeout: 2000,
        hideIcon: true,
        classNames: {
          closeButton: "show",
        },
      });
      onUserAdded(); // ✅ Refresh trainers list
      onClose(); // ✅ Close modal
    } catch (err: any) {
      console.error("❌ Error adding trainer:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to add trainer. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="center">
      <ModalContent>
        {(onCloseModal) => (
          <>
            {/* ✅ Modal Header */}
            <ModalHeader className="flex justify-between">
              <h2 className="text-xl font-bold">Add Trainer</h2>
            </ModalHeader>

            {/* ✅ Modal Body */}
            <ModalBody>
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <div className="grid grid-cols-6 gap-6">
                {/* ✅ Left Side */}
                <div className="col-span-3 grid gap-4">
                  <Input
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <Select
                    name="gender"
                    selectedKeys={[formData.gender]}
                    onSelectionChange={(keys) =>
                      setFormData({ ...formData, gender: Array.from(keys)[0] as string })
                    }
                    required
                  >
                    <SelectItem key="Male">Male</SelectItem>
                    <SelectItem key="Female">Female</SelectItem>
                    <SelectItem key="Prefer not to say">Prefer not to say</SelectItem>
                  </Select>
                  <Input
                    name="birthday"
                    type="date"
                    value={formData.birthday}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    name="address"
                    placeholder="Address"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* ✅ Right Side */}
                <div className="col-span-3 grid gap-4">
                  <Input
                    name="contact_number"
                    placeholder="Contact Number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    name="password"
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    name="confirm_password"
                    type="password"
                    placeholder="Confirm Password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* ✅ Trainer-Specific Fields */}
                <div className="col-span-6 grid gap-4">
                  <Input
                    name="specialization"
                    placeholder="Specialization"
                    value={formData.specialization}
                    onChange={handleChange}
                    required
                  />

                  {/* ✅ Availability Schedule - Now DateTime Input */}
                  <Input
                    name="availability_schedule"
                    type="datetime-local" // ✅ Allows full date-time selection
                    value={formData.availability_schedule}
                    onChange={handleChange}
                    required
                  />

                  <Input
                    name="bio"
                    placeholder="Short bio about the trainer"
                    value={formData.bio}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </ModalBody>

            {/* ✅ Modal Footer */}
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onCloseModal}>
                Close
              </Button>
              <Button color="primary" isLoading={loading} onPress={handleSubmit}>
                {loading ? "Adding..." : "Add Trainer"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AddTrainerModal;
