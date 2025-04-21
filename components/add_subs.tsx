"use client";

import { useState, useEffect } from "react";
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
  addToast,
} from "@heroui/react";
import axios from "axios";

// ✅ API Base URL
const API_BASE = "http://127.0.0.1:8000";

// ✅ Explicitly define prop types
interface AddSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionAdded: () => void;
}

const AddSubscriptionModal: React.FC<AddSubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSubscriptionAdded,
}) => {
  const [formData, setFormData] = useState({
    plan_name: "",
    price: "",
    duration: "monthly",
    features: "",
    status: "hide", // ✅ Default to "hide"
  });

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        plan_name: "",
        price: "",
        duration: "monthly",
        features: "",
        status: "hide",
      });
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError("");

    // ✅ Validate individual fields and show specific toasts
    if (!formData.plan_name) {
      return addToast({
        title: "Missing Plan Name",
        description: "Please enter a plan name.",
        color: "danger",
        timeout: 2500,
      });
    }

    if (!formData.price) {
      return addToast({
        title: "Missing Price",
        description: "Please enter a price.",
        color: "danger",
        timeout: 2500,
      });
    }

    if (!formData.duration) {
      return addToast({
        title: "Missing Duration",
        description: "Please select a duration.",
        color: "danger",
        timeout: 2500,
      });
    }

    if (!formData.features) {
      return addToast({
        title: "Missing Features",
        description: "Please provide the subscription features.",
        color: "danger",
        timeout: 2500,
      });
    }

    if (!formData.status) {
      return addToast({
        title: "Missing Status",
        description: "Please select the subscription status.",
        color: "danger",
        timeout: 2500,
      });
    }

    setLoading(true);

    const token = localStorage.getItem("token");
    console.log("Token before API request:", token);

    if (!token) {
      setLoading(false);
      return addToast({
        title: "Unauthorized",
        description: "Session expired. Please log in again.",
        color: "danger",
        timeout: 2500,
      });
    }

    try {
      await axios.post(`${API_BASE}/api/subscriptions`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      addToast({
        title: "Subscription Added",
        description: "Subscription added successfully!",
        color: "success",
        timeout: 2500,
      });

      onSubscriptionAdded();
      onClose();

      setFormData({
        plan_name: "",
        price: "",
        duration: "monthly",
        features: "",
        status: "hide",
      });
    } catch (err) {
      const error = err as any;
      console.error(
        "❌ Error adding subscription:",
        error.response?.data || error.message
      );
      addToast({
        title: "Failed to Add",
        description:
          error.response?.data?.message || "An error occurred. Please try again.",
        color: "danger",
        timeout: 2500,
      });
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
        backdrop: "bg-black/5",
      }}
    >
      <ModalContent>
        {(onCloseModal) => (
          <>
            {/* ✅ Modal Header */}
            <ModalHeader className="flex justify-between">
              <h2 className="text-xl font-bold">Add Subscription</h2>
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
                    label="Plan Name"
                    name="plan_name"
                    placeholder="Enter plan name"
                    value={formData.plan_name}
                    onChange={handleChange}
                    required
                  />
                  <Select
                    label="Duration"
                    name="duration"
                    selectedKeys={[formData.duration]}
                    onSelectionChange={(keys) =>
                      setFormData({
                        ...formData,
                        duration: Array.from(keys)[0] as string,
                      })
                    }
                    required
                  >
                    <SelectItem key="daily">Daily</SelectItem>
                    <SelectItem key="weekly">Weekly</SelectItem>
                    <SelectItem key="monthly">Monthly</SelectItem>
                    <SelectItem key="yearly">Yearly</SelectItem>
                    <SelectItem key="lifetime">Lifetime</SelectItem>
                  </Select>
                </div>

                {/* ✅ Right Side */}
                <div className="col-span-3 grid gap-4">
                  <Input
                    label="Price"
                    name="price"
                    placeholder="Enter price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                  <Select
                    label="Status"
                    name="status"
                    selectedKeys={[formData.status]}
                    onSelectionChange={(keys) =>
                      setFormData({
                        ...formData,
                        status: Array.from(keys)[0] as "show" | "hide",
                      })
                    }
                    required
                  >
                    <SelectItem key="show">Show</SelectItem>
                    <SelectItem key="hide">Hide</SelectItem>
                  </Select>
                </div>
              </div>

              {/* ✅ Status Select Field */}
              <div className="mt-4">
                <Input
                  label="Features"
                  name="features"
                  placeholder="Use commas to separate features."
                  value={formData.features}
                  onChange={handleChange}
                  required
                />
              </div>
            </ModalBody>

            {/* ✅ Modal Footer */}
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onCloseModal}>
                Close
              </Button>
              {/* ✅ Fix: Directly call handleSubmit */}
              <Button
                color="primary"
                isLoading={loading}
                onPress={handleSubmit}
              >
                {loading ? "Adding..." : "Add Subscription"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AddSubscriptionModal;
