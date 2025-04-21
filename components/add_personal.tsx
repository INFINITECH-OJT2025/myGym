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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// Define prop types for the modal component.
interface AddPersonalTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPersonalTrainerAdded: () => void;
}

// Update the form data type to accept either a File or null for file uploads, and add a 'name' field.
interface FormDataType {
  name: string;
  session: string;
  price: string;
  features: string;
  image: File | null;
  status: "show" | "hide";
}

const AddPersonalTrainerModal: React.FC<AddPersonalTrainerModalProps> = ({
  isOpen,
  onClose,
  onPersonalTrainerAdded,
}) => {
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    session: "",
    price: "",
    features: "",
    image: null,
    status: "hide", // default value
  });

  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  // New state to store the image preview URL.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  // State for controlling the enlarged preview modal.
  const [enlargeModalOpen, setEnlargeModalOpen] = useState<boolean>(false);

  // Update form field values for both text and select inputs.
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file input changes and update the image field.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setFormData({ ...formData, image: file });
      // Create and set the preview URL.
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  // When the modal closes, reset the form state and revoke the preview URL.
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        name: "",
        session: "",
        price: "",
        features: "",
        image: null,
        status: "hide",
      });
      setError("");
      // Revoke the preview URL if available.
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setEnlargeModalOpen(false);
    }
  }, [isOpen, previewUrl]);

  const handleSubmit = async () => {
    setError("");

    // Trim text fields and validate that they have data.
    if (!formData.name.trim()) {
      return addToast({
        title: "Missing Name",
        description: "Please enter a subscription name.",
        color: "danger",
        timeout: 2500,
      });
    }
    if (!formData.session.trim()) {
      return addToast({
        title: "Missing Session",
        description: "Please enter the number of sessions.",
        color: "danger",
        timeout: 2500,
      });
    }
    // Ensure session is a valid positive number.
    if (isNaN(Number(formData.session)) || Number(formData.session) <= 0) {
      return addToast({
        title: "Invalid Session",
        description: "The session number must be a valid positive number.",
        color: "danger",
        timeout: 2500,
      });
    }
    if (!formData.price.trim()) {
      return addToast({
        title: "Missing Price",
        description: "Please enter the price.",
        color: "danger",
        timeout: 2500,
      });
    }
    // Ensure price is a valid positive number.
    if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      return addToast({
        title: "Invalid Price",
        description: "The price must be a valid positive number.",
        color: "danger",
        timeout: 2500,
      });
    }
    if (!formData.features.trim()) {
      return addToast({
        title: "Missing Features",
        description: "Please provide the features.",
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
    // NEW VALIDATION: Require an image file.
    if (!formData.image) {
      return addToast({
        title: "Missing Image",
        description: "Please select an image file.",
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

    // Create FormData to send file along with other fields.
    const data = new FormData();
    data.append("name", formData.name.trim());
    data.append("session", formData.session.trim());
    data.append("price", formData.price.trim());
    data.append("features", formData.features.trim());
    data.append("status", formData.status);
    // Append image if available.
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      await axios.post(`${API_BASE}/api/personal_trainers`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          // Let the browser set the Content-Type for FormData.
        },
        withCredentials: true,
      });

      addToast({
        title: "Personal Trainer Added",
        description: "Record added successfully!",
        color: "success",
        timeout: 2500,
      });

      onPersonalTrainerAdded();
      onClose();

      // Reset the form state.
      setFormData({
        name: "",
        session: "",
        price: "",
        features: "",
        image: null,
        status: "hide",
      });
      // Revoke the preview URL as it's no longer needed.
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    } catch (err: any) {
      console.error(
        "❌ Error adding personal trainer:",
        err.response?.data || err.message
      );
      addToast({
        title: "Failed to Add",
        description:
          err.response?.data?.message ||
          "An error occurred. Please try again.",
        color: "danger",
        timeout: 2500,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onOpenChange={onClose}
        placement="center"
        classNames={{ backdrop: "bg-black/5" }}
      >
        <ModalContent>
          {(onCloseModal) => (
            <>
              {/* Modal Header */}
              <ModalHeader className="flex justify-between">
                <h2 className="text-xl font-bold">Add Personal Trainer Subscription</h2>
              </ModalHeader>

              {/* Modal Body */}
              <ModalBody>
                {error && (
                  <p className="text-red-500 text-sm text-center mb-4">
                    {error}
                  </p>
                )}

                {/* New field for Name */}
                <div className="mb-4">
                  <Input
                    label="Name"
                    name="name"
                    placeholder="Enter Personal Subscription name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Responsive grid: 1 column on small screens, 2 on md+ */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Session"
                    name="session"
                    placeholder="Enter number of sessions"
                    type="number"
                    value={formData.session}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Price"
                    name="price"
                    placeholder="Enter price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />

                  <div className="flex flex-col">
                    <label className="mb-1 text-sm font-medium">Image</label>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="w-full"
                    />
                  </div>

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

                <div className="mt-4">
                  <Input
                    label="Features"
                    name="features"
                    placeholder="List features separated by commas."
                    value={formData.features}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Image Preview */}
                {previewUrl && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-1">Image Preview (click to enlarge)</p>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-24 h-24 object-cover cursor-pointer"
                      onClick={() => setEnlargeModalOpen(true)}
                    />
                  </div>
                )}
              </ModalBody>

              {/* Modal Footer */}
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onCloseModal}>
                  Close
                </Button>
                <Button color="primary" isLoading={loading} onPress={handleSubmit}>
                  {loading ? "Adding..." : "Add Personal Trainer"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Enlarge Image Modal */}
      {enlargeModalOpen && previewUrl && (
        <Modal
          isOpen={enlargeModalOpen}
          onOpenChange={() => setEnlargeModalOpen(false)}
          placement="center"
          classNames={{ backdrop: "bg-black/70" }}
        >
          <ModalContent>
            <div className="flex justify-center items-center p-4">
              <img
                src={previewUrl}
                alt="Enlarged Preview"
                className="max-w-full max-h-screen"
                onClick={() => setEnlargeModalOpen(false)}
              />
            </div>
          </ModalContent>
        </Modal>
      )}
    </>
  );
};

export default AddPersonalTrainerModal;
