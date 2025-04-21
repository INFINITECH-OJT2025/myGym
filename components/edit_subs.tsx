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
  addToast,
} from "@heroui/react";
import axios from "axios";

// ✅ API Base URL
const API_BASE = "http://127.0.0.1:8000";

// ✅ Define Subscription Interface
interface Subscription {
  id: number;
  plan_name: string;
  price: number;
  duration: string;
  features: string;
  status: "show" | "hide";
}

interface EditSubscriptionModalProps {
  isOpen: boolean;
  subscriptionId: number | null;
  onClose: () => void;
  onSubscriptionUpdated: () => void;
}

export default function EditSubscriptionModal({
  isOpen,
  subscriptionId,
  onClose,
  onSubscriptionUpdated,
}: EditSubscriptionModalProps) {
  const [formData, setFormData] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);
  const targetRef = useRef(null);
  const { moveProps } = useDraggable({ targetRef, isDisabled: !isOpen });
  const [initialData, setInitialData] = useState<Subscription | null>(null);

  // ✅ Fetch subscription data when modal opens
  useEffect(() => {
    if (subscriptionId && isOpen) {
      fetchSubscriptionData(subscriptionId);
    }
  }, [subscriptionId, isOpen]);

  const [subscription, setSubscription] = useState({
    price: formData?.price.toString().replace(/,/g, "") || "",
    // other fields...
  });

  // ✅ Fetch subscription data from backend
  const fetchSubscriptionData = async (id: number) => {
    setFetching(true);

    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No token found! User must log in.");
      setFetching(false);
      return;
    }

    try {
      const response = await axios.get(`${API_BASE}/api/subscriptions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      console.log("✅ Subscription Data:", response.data);
      const subscriptionData = response.data as Subscription;
      const processedData = {
        ...subscriptionData,
        price: Number(String(subscriptionData.price).replace(/,/g, "")),
      };

      setFormData(processedData);
      setInitialData(processedData);
    } catch (err: any) {
      console.error(
        "❌ Error fetching subscription data:",
        err.response?.data || err.message
      );
    } finally {
      setFetching(false);
    }
  };

  // ✅ Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
  };

  // ✅ Handle selection changes
  const handleSelectionChange = (name: keyof Subscription, keys: Selection) => {
    const selectedValue = Array.from(keys)[0] as string;
    setFormData((prev) => (prev ? { ...prev, [name]: selectedValue } : null));
  };

  // ✅ Handle form submission (update subscription)
  const handleSubmit = async () => {
    if (!subscriptionId || !formData) return;

    // Destructure fields for easy validation
    const { plan_name, price, duration, features, status } = formData;

    // ✅ Check for missing required fields
    if (!plan_name || !features ) {
      return addToast({
        title: "Incomplete Fields",
        description: "Please fill out all fields.",
        color: "danger",
        timeout: 2500,
      });
    }

    if (price === 0) {
      return addToast({
        title: "Invalid price",
        description: "Please put a valid price.",
        color: "danger",
        timeout: 2500,
      });
    }

    if (!formData.status) {
      return addToast({
        title: "Invalid Status",
        description: "Please put a valid status.",
        color: "danger",
        timeout: 2500,
      });
    }

    if (!formData.duration) {
      return addToast({
        title: "Invalid Duration",
        description: "Please put a valid duration.",
        color: "danger",
        timeout: 2500,
      });
    }

    if (
      initialData &&
      JSON.stringify(formData) === JSON.stringify(initialData)
    ) {
      return addToast({
        title: "No Changes Detected",
        description: "You haven't made any changes.",
        color: "warning",
        timeout: 2500,
      });
    }

    setLoading(true);

    const token = localStorage.getItem("token");
    if (!token) {
      addToast({
        title: "Authentication Error",
        description: "No token found. Please log in again.",
        color: "danger",
        timeout: 2500,
      });
      setLoading(false);
      return;
    }

    try {
      await axios.put(
        `${API_BASE}/api/subscriptions/${subscriptionId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      // ✅ Success Toast
      addToast({
        title: "Subscription Updated",
        description: "The subscription has been successfully updated.",
        color: "success",
        timeout: 2500,
      });

      onSubscriptionUpdated();
      onClose();
    } catch (err: any) {
      console.error(
        "❌ Error updating subscription:",
        err.response?.data || err.message
      );
      addToast({
        title: "Update Failed",
        description: "An error occurred. Please try again.",
        color: "danger",
        timeout: 2500,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!formData) {
    return null;
  }

  return (
    <Modal
      ref={targetRef}
      isOpen={isOpen}
      size="md"
      onOpenChange={onClose}
      placement="center"
      classNames={{
        backdrop: "bg-black/15",
      }}
    >
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader {...moveProps} className="flex justify-between">
              <h2 className="text-xl font-bold">Edit Subscription</h2>
            </ModalHeader>
            <ModalBody>
              {fetching ? (
                <p>Loading subscription details...</p>
              ) : (
                <div className="grid gap-4">
                  <Input
                    label="Plan Name"
                    name="plan_name"
                    value={formData.plan_name}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Price"
                    name="price"
                    type="text"
                    value={formData.price.toLocaleString()}
                    onChange={(e) => {
                      const cleanedValue = e.target.value.replace(/,/g, "");
                      setFormData({
                        ...formData,
                        price: Number(cleanedValue),
                      });
                    }}
                  />
                  <Select
                    label="Duration"
                    name="duration"
                    selectedKeys={[formData.duration]}
                    onSelectionChange={(keys) =>
                      handleSelectionChange("duration", keys)
                    }
                    required
                  >
                    <SelectItem key="daily">Daily</SelectItem>
                    <SelectItem key="weekly">Weekly</SelectItem>
                    <SelectItem key="monthly">Monthly</SelectItem>
                    <SelectItem key="yearly">Yearly</SelectItem>
                    <SelectItem key="lifetime">Lifetime</SelectItem>
                  </Select>
                  <Input
                    label="Features"
                    name="features"
                    value={formData.features}
                    onChange={handleChange}
                    required
                  />
                  <Select
                    label="Status"
                    name="status"
                    selectedKeys={[formData.status]}
                    onSelectionChange={(keys) =>
                      handleSelectionChange("status", keys)
                    }
                    required
                  >
                    <SelectItem key="show">Show</SelectItem>
                    <SelectItem key="hide">Hide</SelectItem>
                  </Select>
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onCloseModal}>
                Close
              </Button>
              <Button
                color="primary"
                isLoading={loading}
                onPress={handleSubmit}
              >
                {loading ? "Updating..." : "Update Subscription"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
