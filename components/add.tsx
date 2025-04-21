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
import { useIsMobile } from "@/app/hooks/useMobile"; // adjust to your path

// ✅ API Base URL
const API_BASE = "http://127.0.0.1:8000";

// ✅ Explicitly define prop types
interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
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
    role: "member",
  });
  const [contactError, setContactError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const isMobile = useIsMobile();

  const validateContact = (value: string) => {
    if (!/^\d{11}$/.test(value)) {
      setContactError("Contact number must be exactly 11 digits.");
    } else {
      setContactError("");
    }
  };

  const validateEmail = (value: string) => {
    if (!value.endsWith("@gmail.com")) {
      setEmailError("Email must be a Gmail address (e.g., example@gmail.com).");
    } else {
      setEmailError("");
    }
  };

  const validatePasswords = (password: string, confirmPassword: string) => {
    if (password && confirmPassword && password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
    } else {
      setPasswordError("");
    }
  };

  // ✅ Define `handleChange`
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "contact_number") validateContact(value);
    if (name === "email") validateEmail(value);
    if (name === "password" || name === "confirm_password") {
      const updatedForm = {
        ...formData,
        [name]: value,
      };
      validatePasswords(updatedForm.password, updatedForm.confirm_password);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const {
      name,
      email,
      contact_number,
      birthday,
      address,
      gender,
      password,
      confirm_password,
      role,
    } = formData;

    // 🛑 Field-level required checks
    if (!name) {
      return addToast({
        title: "Missing Name",
        description: "Please enter the full name.",
        color: "danger",
        timeout: 2500,
      });
    }

    if (!birthday) {
      return addToast({
        title: "Missing Birthday",
        description: "Please select the birthday.",
        color: "danger",
        timeout: 2500,
      });
    }

    if (!address) {
      return addToast({
        title: "Missing Address",
        description: "Please enter the address.",
        color: "danger",
        timeout: 2500,
      });
    }

    if (!contact_number) {
      return addToast({
        title: "Missing Contact Number",
        description: "Please enter a contact number.",
        color: "danger",
        timeout: 2500,
      });
    }
    if (!birthday) {
      return addToast({
        title: "Missing Birthday",
        description: "Please enter a birthday.",
        color: "danger",
        timeout: 2500,
      });
    }

    // ✅ Check if user is at least 18
    const birthdayDate = new Date(birthday);
    const today = new Date();
    const age = today.getFullYear() - birthdayDate.getFullYear();
    const m = today.getMonth() - birthdayDate.getMonth();
    const is18OrOlder =
      age > 18 ||
      (age === 18 && m >= 0 && today.getDate() >= birthdayDate.getDate());

    if (!is18OrOlder) {
      return addToast({
        title: "Age Restriction",
        description: "User must be at least 18 years old.",
        color: "warning",
        timeout: 2500,
      });
    }

    if (!email) {
      return addToast({
        title: "Missing Email",
        description: "Please enter an email address.",
        color: "danger",
        timeout: 2500,
      });
    }

    if (!password || !confirm_password) {
      return addToast({
        title: "Missing Password",
        description: "Please enter and confirm the password.",
        color: "danger",
        timeout: 2500,
      });
    }

    // ✅ Check if any previous validation errors exist
    if (contactError || emailError || passwordError) {
      return addToast({
        title: "Fix Validation Errors",
        description: "Please correct the highlighted fields before submitting.",
        color: "warning",
        timeout: 2500,
      });
    }

    // ✅ Check if passwords match (if not already caught)
    if (password !== confirm_password) {
      setPasswordError("Passwords do not match.");
      return addToast({
        title: "Password Mismatch",
        description: "Passwords do not match.",
        color: "danger",
        timeout: 2500,
      });
    }

    // ✅ All good: proceed
    setError("");
    setLoading(true);

    try {
      await axios.post(
        `${API_BASE}/api/users`,
        {
          name,
          email,
          contact_number,
          birthday,
          address,
          gender,
          password,
          password_confirmation: confirm_password,
          role,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            "Content-Type": "application/json",
          },
        }
      );

      addToast({
        title: "User Added Successfully",
        description: `An activation email was sent to ${formData.name}.`,
        color: "success",
        timeout: 2500,
      });

      onUserAdded();
      onClose();
    } catch (err: any) {
      console.error("❌ Error adding user:", err.response?.data || err.message);
      setError(err.response?.data?.message || "Failed to add user. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      placement="center"
      classNames={{
       backdrop: "bg-black/10",
      }}
    >
      <ModalContent>
        {(onCloseModal) => (
          <>
            {/* ✅ Modal Header */} 
            <ModalHeader className="flex justify-between">
              <h2 className="text-xl font-bold">Add New User</h2>
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
                    label="Full Name"
                    name="name"
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                  <Select
                    label="Gender"
                    name="gender"
                    selectedKeys={[formData.gender]}
                    onSelectionChange={(keys) =>
                      setFormData({
                        ...formData,
                        gender: Array.from(keys)[0] as string,
                      })
                    }
                    required
                  >
                    <SelectItem key="Male">Male</SelectItem>
                    <SelectItem key="Female">Female</SelectItem>
                    <SelectItem key="Prefer not to say">
                      Prefer not to say
                    </SelectItem>
                  </Select>
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
                </div>

                {/* ✅ Right Side */}
                <div className="col-span-3 grid gap-4">
                  <Input
                    label="Contact Number"
                    name="contact_number"
                    placeholder="Enter contact number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    required
                  />
                  {contactError && (
                    <p className="text-xs text-red-500 mt-[-12px] ml-1">
                      {contactError}
                    </p>
                  )}
                  <Input
                    label="Email"
                    name="email"
                    type="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                  {emailError && (
                    <p className="text-xs text-red-500 mt-[-12px] ml-1">
                      {emailError}
                    </p>
                  )}
                  <Input
                    label="Password"
                    name="password"
                    type="password"
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  {passwordError && (
                    <p className="text-xs text-red-500 mt-[-12px] ml-1">
                      {passwordError}
                    </p>
                  )}
                  <Input
                    label="Confirm Password"
                    name="confirm_password"
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                  />
                  {passwordError && (
                    <p className="text-xs text-red-500 mt-[-12px] ml-1">
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* ✅ Role Dropdown in the Middle */}
                <div className="col-span-6 flex justify-center mt-2">
                  <div className="w-1/2">
                    <Select
                      label="Role"
                      name="role"
                      selectedKeys={[formData.role]}
                      onSelectionChange={(keys) =>
                        setFormData({
                          ...formData,
                          role: Array.from(keys)[0] as string,
                        })
                      }
                      required
                    >
                      <SelectItem key="member">Member</SelectItem>
                      <SelectItem key="trainer">Trainer</SelectItem>
                      <SelectItem key="admin">Admin</SelectItem>
                    </Select>
                  </div>
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
                onPress={() => handleSubmit(new Event("submit") as any)}
              >
                {loading ? "Adding..." : "Add User"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AddUserModal;
