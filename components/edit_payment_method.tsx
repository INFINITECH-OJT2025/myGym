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
  useDisclosure,
  useDraggable,
} from "@heroui/react";
import axios from "axios";
import { addToast } from "@heroui/react";

const API_BASE = "http://127.0.0.1:8000";

interface PaymentMethod {
  name: string;
  account_number: string;
  status: "active" | "inactive";
  qr_code: File | null;
  qr_code_url: string;
}

interface EditPaymentMethodProps {
  isOpen: boolean;
  paymentMethodId: number | null;
  onClose: () => void;
  onMethodUpdated: () => void;
}

const EditPaymentMethod: React.FC<EditPaymentMethodProps> = ({
  isOpen,
  paymentMethodId,
  onClose,
  onMethodUpdated,
}) => {
  const [formData, setFormData] = useState<PaymentMethod>({
    name: "",
    account_number: "",
    status: "active",
    qr_code: null,
    qr_code_url: "",
  });
  const [initialData, setInitialData] = useState<PaymentMethod | null>(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string>("");
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [existingQrPreview, setExistingQrPreview] = useState<string | null>(
    null
  );
  const [newQrPreview, setNewQrPreview] = useState<string | null>(null);
  const [showNewQrModal, setShowNewQrModal] = useState<boolean>(false);

  const existingPreviewRef = useRef(null);
  const newPreviewRef = useRef(null);

  const { moveProps: moveExisting } = useDraggable({
    targetRef: existingPreviewRef,
    isDisabled: !existingQrPreview,
  });

  const { moveProps: moveNew } = useDraggable({
    targetRef: newPreviewRef,
    isDisabled: !newQrPreview,
  });

  // ✅ Fetch Payment Method Details When Modal Opens
  useEffect(() => {
    if (paymentMethodId && isOpen) {
      console.log(`🔍 Fetching Payment Method ID: ${paymentMethodId}`);
      fetchPaymentMethod(paymentMethodId);
    }
  }, [paymentMethodId, isOpen]);

  const fetchPaymentMethod = async (id: number) => {
    setFetching(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in.");
        setFetching(false);
        return;
      }

      interface PaymentMethodResponse {
        name: string;
        account_number: string;
        status: "active" | "inactive";
        qr_code?: string;
      }

      const response = await axios.get<PaymentMethodResponse>(
        `${API_BASE}/api/payment-methods/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.data || !response.data.name) {
        setError("Payment method not found.");
        setFetching(false);
        return;
      }

      console.log("✅ API Response Data:", response.data);

      // Construct the data object for both form and initial state.
      const data = {
        name: response.data.name || "",
        account_number: response.data.account_number || "",
        status: response.data.status || "active",
        qr_code: null, // Reset new upload
        qr_code_url: response.data.qr_code || "", // Stored image URL
      };

      // Save the fetched data into both states.
      setFormData(data);
      setInitialData(data);

      console.log("🖼️ QR Code Image URL:", data.qr_code_url);
    } catch (err: any) {
      setError("Failed to fetch payment method.");
    } finally {
      setFetching(false);
    }
  };

  // ✅ Handle Input Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ✅ Handle Status Change
  const handleStatusChange = (keys: any) => {
    setFormData((prev) => ({
      ...prev,
      status: Array.from(keys)[0] as "active" | "inactive",
    }));
  };

  // ✅ Handle QR Code Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);

      setFormData((prev) => ({
        ...prev,
        qr_code: file, // Keep existing QR in state
      }));

      setNewQrPreview(previewUrl); // 🔥 Preview for new file only
    }
  };

  
  // ✅ Submit Update
  const handleSubmit = async () => {
    if (!paymentMethodId) return;
    setLoading(true);
    setError("");

    // Check for changes before submission.
    if (initialData) {
      const noChange =
        formData.name === initialData.name &&
        formData.account_number === initialData.account_number &&
        formData.status === initialData.status &&
        // Check QR code: if no new file is selected, both remain null.
        formData.qr_code === initialData.qr_code;
      if (noChange) {
        addToast({
          title: "No Changes Detected",
          description: "You haven't made any changes.",
          color: "warning",
          timeout: 2500,
        });
        setLoading(false);
        return;
      }
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("_method", "PUT"); // Laravel needs this
      formDataToSend.append("name", String(formData.name));
      formDataToSend.append("account_number", String(formData.account_number));
      formDataToSend.append("status", String(formData.status));

      // Append the QR Code only if a new file is selected.
      if (formData.qr_code) {
        formDataToSend.append("qr_code", formData.qr_code);
      }

      const token = localStorage.getItem("token");
      if (!token) {
        setError("No authentication token found. Please log in.");
        setLoading(false);
        return;
      }

      await axios.post(
        `${API_BASE}/api/payment-methods/${paymentMethodId}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      addToast({
        title: "Payment Method Updated",
        description: `Payment method "${formData.name}" has been updated successfully.`,
        color: "success",
        variant: "flat",
        radius: "full",
        timeout: 2000,
        hideIcon: true,
        classNames: {
          closeButton: "show",
        },
      });

      // Call the parent callback to update the UI immediately
      onMethodUpdated();
      // Close the modal
      onClose();
    } catch (err: any) {
      console.error("❌ Error:", err?.response?.data);

      // Laravel validation errors
      const message =
        err?.response?.data?.message ||
        "Something went wrong while updating the payment method.";
      const validationErrors = err?.response?.data?.errors;
      const firstFieldWithError = validationErrors
        ? Object.keys(validationErrors)[0]
        : null;
      const firstMessage = firstFieldWithError
        ? validationErrors[firstFieldWithError][0]
        : message;

      addToast({
        title: "Update Failed",
        description: firstMessage,
        color: "danger",
        variant: "flat",
        radius: "full",
        timeout: 4000,
        hideIcon: true,
        classNames: {
          closeButton: "show",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="center">
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader className="flex justify-between">
              <h2 className="text-xl font-bold">Edit Payment Method</h2>
            </ModalHeader>

            <ModalBody>
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
              {fetching ? (
                <p className="text-center">Loading payment method details...</p>
              ) : (
                <div className="grid gap-4">
                  <div>
                    <label className="block font-medium text-gray-700">
                      Payment Name
                    </label>
                    <Input
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">
                      Account Number
                    </label>
                    <Input
                      name="account_number"
                      value={formData.account_number}
                      onChange={handleChange}
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
                      onSelectionChange={handleStatusChange}
                      required
                    >
                      <SelectItem key="active">Active</SelectItem>
                      <SelectItem key="inactive">Inactive</SelectItem>
                    </Select>
                  </div>

                  {/* ✅ Existing QR Code */}
                  {formData.qr_code_url && (
                    <div className="flex flex-col items-center">
                      <label className="block font-medium text-gray-700">
                        Existing QR Code
                      </label>
                      <img
                        src={formData.qr_code_url}
                        alt="Existing QR Code"
                        className="w-16 h-16 rounded-lg shadow-md object-cover cursor-pointer"
                        onClick={() =>
                          setExistingQrPreview(formData.qr_code_url)
                        }
                      />
                    </div>
                  )}

                  {/* ✅ Allow Uploading a New QR Code */}
                  <div>
                    <label className="block font-medium text-gray-700">
                      Upload New QR Code
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const previewUrl = URL.createObjectURL(file);
                          setFormData((prev) => ({
                            ...prev,
                            qr_code: file,
                          }));
                          setNewQrPreview(previewUrl); // ✅ Set preview image
                          setShowNewQrModal(false); // ensure it doesn't pop open
                        }
                      }}
                    />

                    {/* ✅ New QR Code Preview */}
                    {newQrPreview && (
                      <div className="flex flex-col items-center mt-4">
                        <label className="block font-medium text-gray-700">
                          New QR Code Preview
                        </label>
                        <img
                          src={newQrPreview}
                          alt="New QR Code Preview"
                          className="w-20 h-20 rounded-md object-contain shadow border cursor-pointer"
                          onClick={() => setShowNewQrModal(true)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </ModalBody>
            {/* Floating Preview: Existing QR */}
            {existingQrPreview && (
              <div
                ref={existingPreviewRef}
                {...moveExisting}
                className="fixed top-24 left-24 bg-white shadow-xl rounded-lg border z-[9999] p-4 cursor-move w-[300px]"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">Existing QR Code</span>
                  <button
                    className="text-sm text-red-500"
                    onClick={() => setExistingQrPreview(null)}
                  >
                    ✕
                  </button>
                </div>
                <img
                  src={existingQrPreview}
                  alt="Existing QR Preview"
                  className="w-full h-auto object-contain"
                />
              </div>
            )}

            {/* Floating Preview: New QR */}
            {showNewQrModal && newQrPreview && (
              <div
                ref={newPreviewRef}
                {...moveNew}
                className="fixed top-24 left-[400px] bg-white shadow-xl rounded-lg border z-[9999] p-4 cursor-move w-[300px]"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm">New QR Code</span>
                  <button
                    className="text-sm text-red-500"
                    onClick={() => setShowNewQrModal(false)}
                  >
                    ✕
                  </button>
                </div>
                <img
                  src={newQrPreview}
                  alt="New QR Preview"
                  className="w-full h-auto object-contain"
                />
              </div>
            )}

            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onCloseModal}>
                Close
              </Button>
              <Button
                color="primary"
                isLoading={loading}
                onPress={handleSubmit}
              >
                {loading ? "Updating..." : "Update Payment Method"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default EditPaymentMethod;
