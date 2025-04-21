"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  ModalContent,
  Button,
  Input,
  Select,
  SelectItem,
} from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export interface UserProfile {
  name: string;
  email: string;
  image: string | null;
  contact_number: string;
  birthday: string;
  address: string;
  gender: string;
  role: string;
  loyalty_points_total: number;
}

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onProfileUpdated: (updatedUser: UserProfile) => void;
}

export default function EditProfileModal({
  isOpen,
  onClose,
  user,
  onProfileUpdated,
}: EditProfileModalProps) {
  const [name, setName] = useState(user.name);
  const [contactNumber, setContactNumber] = useState(user.contact_number);
  const [birthday, setBirthday] = useState(user.birthday);
  const [address, setAddress] = useState(user.address);
  const [gender, setGender] = useState(user.gender);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Update form fields if the user prop changes.
  useEffect(() => {
    setName(user.name);
    setContactNumber(user.contact_number);
    setBirthday(user.birthday);
    setAddress(user.address);
    setGender(user.gender);
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User is not authenticated.");
        setLoading(false);
        return;
      }

      // Use FormData without a method override if your backend route is defined as POST.
      const formData = new FormData();
      formData.append("name", name);
      formData.append("contact_number", contactNumber);
      formData.append("birthday", birthday);
      formData.append("address", address);
      formData.append("gender", gender);

      // Append image file if available.
      if (imageFile) {
        formData.append("image", imageFile);
      }

      // Send POST with formData.
      const response = await axios.post(`${API_BASE}/api/user`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });

      // Ensure the response contains the complete updated user object.
      // Adjust based on your backend response.
      const updatedUser = response.data as { user: UserProfile };
      onProfileUpdated(updatedUser.user);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="center">
      <ModalContent>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Edit Profile</h2>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-1">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1">Contact Number</label>
              <Input
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1">Birthday</label>
              <Input
                type="date"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1">Address</label>
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="gender-select" className="block mb-1">Gender</label>
              <Select
                aria-label="Gender"
                placeholder="Select gender"
                selectedKeys={new Set([gender])}
                onSelectionChange={(keys) => {
                  const [value] = Array.from(keys);
                  setGender(value as string);
                }}
                id="gender-select"
                isRequired
              >
                <SelectItem key="Prefer not to say">
                  Prefer not to say
                </SelectItem>
                <SelectItem key="Male">Male</SelectItem>
                <SelectItem key="Female">Female</SelectItem>
              </Select>
              </div>
            <div>
              <label htmlFor="profile-picture" className="block mb-1">
                Change Profile Picture
              </label>
              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                color="secondary"
                onPress={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="solid"
                color="primary"
                disabled={loading}
              >
                {loading ? "Updating..." : "Update Profile"}
              </Button>
            </div>
          </form>
        </div>
      </ModalContent>
    </Modal>
  );
}
