"use client";

import { useState, useEffect, useRef } from "react";
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
  useDraggable,
  Selection,
} from "@heroui/react";
import axios from "axios";

// ✅ API Base URL
const API_BASE = "http://127.0.0.1:8000";

// ✅ Define User Interface
interface User {
  id: number;
  name: string;
  email: string;
  contact_number: string;
  birthday: string;
  address: string;
  gender: "Male" | "Female" | "Prefer not to say";
  role: "member" | "trainer" | "admin";
  image_url?: string | null;
}

interface EditUserModalProps {
  isOpen: boolean;
  userId: number | null;
  onClose: () => void;
  onUserUpdated: () => void;
}

export default function EditUserModal({
  isOpen,
  userId,
  onClose,
  onUserUpdated,
}: EditUserModalProps) {
  const [formData, setFormData] = useState<User>({
    id: 0,
    name: "",
    email: "",
    contact_number: "",
    birthday: "",
    address: "",
    gender: "Prefer not to say",
    role: "member",
    image_url: null,
  });

  const [loading, setLoading] = useState<boolean>(false);
  const targetRef = useRef(null);
  const { moveProps } = useDraggable({ targetRef, isDisabled: !isOpen });

  // ✅ Fetch user data when modal opens and userId is available
  useEffect(() => {
    if (userId && isOpen) {
      fetchUserData(userId);
    }
  }, [userId, isOpen]);

  // ✅ Handle image upload
  const handleImageUpload = async (file: File) => {
    const uploadData = new FormData();
    uploadData.append("image", file);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("❌ No token found! User must log in.");
        return;
      }

      const response = await axios.post<{ image_url: string }>(
        `${API_BASE}/api/users/${userId}/upload-image`,
        uploadData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("✅ Image uploaded:", response.data);

      // ✅ Update image preview AFTER successful upload
      setFormData((prev) => ({ ...prev, image_url: response.data.image_url }));
    } catch (err: any) {
      console.error(
        "❌ Error uploading image:",
        err.response?.data || err.message
      );
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ Generate temporary URL for preview
    const previewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, image_url: previewUrl }));

    // ✅ Proceed with actual upload
    handleImageUpload(file);
  };

  // ✅ Fetch user data from backend
  const fetchUserData = async (id: number) => {
    const token = localStorage.getItem("token");

    console.log("Fetching user data with token:", token); // Debugging

    if (!token) {
      console.error("❌ No token found! User must log in.");
      return;
    }

    try {
      const response = await axios.get<{ user: User }>(
        `${API_BASE}/api/users/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("✅ User data fetched:", response.data);
      setFormData(response.data.user); // ✅ Populate form with user data
    } catch (err: any) {
      console.error(
        "❌ Error fetching user data:",
        err.response?.data || err.message
      );
    }
  };

  // ✅ Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Handle selection change safely for Role
  const handleRoleChange = (keys: Selection) => {
    const selectedRole = Array.from(keys)[0] as "member" | "trainer" | "admin";
    setFormData({ ...formData, role: selectedRole });
  };

  // ✅ Handle selection change safely for Gender
  const handleGenderChange = (keys: Selection) => {
    const selectedGender = Array.from(keys)[0] as
      | "Male"
      | "Female"
      | "Prefer not to say";
    setFormData({ ...formData, gender: selectedGender });
  };

  // ✅ Handle form submission (update user)
  const handleSubmit = async () => {
    if (!userId) return;

    setLoading(true);
    const token = localStorage.getItem("token");

    console.log("Updating user with token:", token); // Debugging

    if (!token) {
      console.error("❌ No token found! User must log in.");
      return;
    }

    try {
      await axios.put(`${API_BASE}/api/users/${userId}`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("✅ User updated successfully.");
      onUserUpdated();
      onClose();
    } catch (err: any) {
      console.error(
        "❌ Error updating user:",
        err.response?.data || err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      ref={targetRef}
      isOpen={isOpen}
      onOpenChange={onClose}
      backdrop="opaque" // OR customize it using classNames
      classNames={{
        backdrop: "bg-black/20 backdrop-blur-sm", // <--- 🔍 transparent but still modal-like
      }}
      placement="center"
    >
      <ModalContent>
        {(onCloseModal) => (
          <>
            {/* ✅ Modal Header */}
            <ModalHeader {...moveProps} className="flex justify-between">
              <h2 className="text-xl font-bold">Edit User</h2>
            </ModalHeader>

            {/* ✅ Modal Body - Scrollable & Clean Layout */}
            <ModalBody className="overflow-y-auto max-h-[80vh]">
              <div className="grid gap-4">
                <Input
                  label="Full Name"
                  name="name"
                  placeholder="Enter full name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Email"
                  name="email"
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Contact Number"
                  name="contact_number"
                  placeholder="Enter contact number"
                  value={formData.contact_number}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Birthday"
                  name="birthday"
                  type="date"
                  value={formData.birthday}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Address"
                  name="address"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />

                {/* Gender Selection */}
                <Select
                  label="Gender"
                  name="gender"
                  selectedKeys={[formData.gender]}
                  onSelectionChange={handleGenderChange}
                  required
                >
                  <SelectItem key="Male">Male</SelectItem>
                  <SelectItem key="Female">Female</SelectItem>
                  <SelectItem key="Prefer not to say">
                    Prefer not to say
                  </SelectItem>
                </Select>

                {/* Role Selection (small size) */}
                <Select
                  label="Role"
                  name="role"
                  selectedKeys={[formData.role]}
                  onSelectionChange={handleRoleChange}
                  required
                  className="text-sm"
                >
                  <SelectItem key="member">Member</SelectItem>
                  <SelectItem key="trainer">Trainer</SelectItem>
                  <SelectItem key="admin">Admin</SelectItem>
                </Select>

                {/* Image Upload Section (Below Inputs) */}
                <div className="flex flex-col items-center gap-2">
                  {/* Image Preview */}
                  {formData.image_url ? (
                    <img
                      src={`${formData.image_url}`}
                      alt="User Image"
                      className="w-24 h-24 object-cover rounded-md border"
                    />
                  ) : (
                    <span className="text-gray-500 text-xs">
                      No Image Available
                    </span>
                  )}

                  {/* File Input */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageChange(e)}
                  />
                </div>
              </div>
            </ModalBody>

            {/* ✅ Modal Footer */}
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onCloseModal}>
                Close
              </Button>
              <Button
                color="primary"
                isLoading={loading}
                onPress={handleSubmit}
              >
                {loading ? "Updating..." : "Update User"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
