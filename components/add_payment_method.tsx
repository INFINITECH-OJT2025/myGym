"use client";

import { useState,useEffect } from "react";
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

const API_BASE = "http://127.0.0.1:8000";

interface AddPaymentMethodProps {
  isOpen: boolean;
  onClose: () => void;
  onMethodAdded: () => void;
}

const AddPaymentMethod: React.FC<AddPaymentMethodProps> = ({
  isOpen,
  onClose,
  onMethodAdded,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    account_number: "",
    qr_code: null as File | null,
    status: "inactive" as "active" | "inactive",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, qr_code: e.target.files[0] });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    if (!formData.name) {
      return addToast({
        title: "Missing Payment Name",
        description: "Please enter a payment name.",
        color: "danger",
        timeout: 2500,
      });
    }

    if (!formData.status) {
      return addToast({
        title: "Missing Status",
        description: "Please select a status.",
        color: "danger",
        timeout: 2500,
      });
    }
    if (!formData.account_number) {
      return addToast({
        title: "Missing Account Number",
        description: "Please enter an account number.",
        color: "danger",
        timeout: 2500,
      });
    }
    if (!formData.qr_code) {
      return addToast({
        title: "Missing QR Code",
        description: "Please upload a QR code.",
        color: "danger",
        timeout: 2500,
      });
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        addToast({
          title: "Authentication Error",
          description: "No authentication token found. Please log in.",
          color: "danger",
          timeout: 2500,
        });
        setLoading(false);
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("account_number", formData.account_number);
      formDataToSend.append("status", formData.status);
      formDataToSend.append(
        "qr_code",
        formData.qr_code!,
        formData.qr_code!.name
      );

      await axios.post(`${API_BASE}/api/payment-methods`, formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      addToast({
        title: "Payment Method Added",
        description: "Payment method added successfully!",
        color: "success",
        timeout: 2500,
      });

      onMethodAdded();
      onClose();
    } catch (err) {
      console.error(
        "❌ Error adding payment method:",
        (err as any).response?.data || (err as any).message
      );
      addToast({
        title: "Error",
        description: "Failed to add payment method. Try again.",
        color: "danger",
        timeout: 2500,
      });
      setError("Failed to add payment method. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        account_number: "",
        status: "inactive",
        qr_code: null,
      });
      setError("");
    }
  }, [isOpen]);

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
              <h2 className="text-xl font-bold">Add Payment Method</h2>
            </ModalHeader>

            {/* ✅ Modal Body */}
            <ModalBody>
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <div className="grid gap-4">
                <div>
                  <label className="block font-medium text-gray-700">
                    Payment Name
                  </label>
                  <Input
                    name="name"
                    placeholder="Enter payment method name (e.g., Gcash, PayPal)"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700">
                    Account Number
                  </label>
                  <Input
                    name="account_number"
                    placeholder="Enter account number"
                    value={formData.account_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        account_number: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-gray-700">
                    Status
                  </label>
                  <Select
                    name="status"
                    selectedKeys={[formData.status]}
                    onSelectionChange={(keys) =>
                      setFormData({
                        ...formData,
                        status: Array.from(keys)[0] as "active" | "inactive",
                      })
                    }
                    required
                  >
                    <SelectItem key="active">Active</SelectItem>
                    <SelectItem key="inactive">Inactive</SelectItem>
                  </Select>
                </div>

                <div>
                  <label className="block font-medium text-gray-700">
                    QR Code
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  {formData.qr_code && (
                    <p className="text-sm text-gray-500 mt-1">
                      Selected: {formData.qr_code.name}
                    </p>
                  )}
                </div>
              </div>
            </ModalBody>

            {/* ✅ Modal Footer */}
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onCloseModal}>
                Close
              </Button>
              <Button color="primary" onPress={handleSubmit}>
                {"Add Payment Method"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default AddPaymentMethod;
