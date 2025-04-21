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

// Define the prop types for the edit modal.
interface EditPersonalTrainerModalProps {
  isOpen: boolean;
  personalTrainerId: number | null; // ID of the personal trainer to edit
  onClose: () => void;
  onPersonalTrainerUpdated: () => void;
}

// Update the form data type to accept either a File or a string for the image.
interface FormDataType {
  name: string;
  session: string;
  price: string;
  features: string;
  image: File | string | null;
  status: "show" | "hide";
}

const EditPersonalTrainerModal: React.FC<EditPersonalTrainerModalProps> = ({
  isOpen,
  personalTrainerId,
  onClose,
  onPersonalTrainerUpdated,
}) => {
  const [formData, setFormData] = useState<FormDataType>({
    name: "",
    session: "",
    price: "",
    features: "",
    image: null,
    status: "hide",
  });
  // Store the initially fetched data for later comparison.
  const [initialData, setInitialData] = useState<FormDataType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Handler for regular input or select changes.
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handler for file input changes.
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFormData({ ...formData, image: e.target.files[0] });
    }
  };

  // Fetch the existing personal trainer data when the modal opens.
  useEffect(() => {
    if (isOpen && personalTrainerId) {
      setLoading(true);
      const token = localStorage.getItem("token");
      axios
        .get(`${API_BASE}/api/personal_trainers/${personalTrainerId}`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            Accept: "application/json",
          },
        })
        .then((response) => {
          const data = response.data as {
            name?: string;
            session?: number;
            price?: number;
            features?: string;
            image?: string;
            status?: "show" | "hide";
          };
          const prepopulated: FormDataType = {
            name: data.name || "",
            session: data.session?.toString() || "",
            price: data.price?.toString() || "",
            features: data.features || "",
            image: data.image || "",
            status: data.status || "hide",
          };
          setFormData(prepopulated);
          setInitialData(prepopulated);
        })
        .catch((err) => {
          console.error("Error fetching personal trainer data:", err);
          setError("Failed to load data.");
        })
        .then(() => {
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isOpen, personalTrainerId]);

  // Reset the form when modal closes.
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
      setInitialData(null);
      setError("");
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    setError("");

    // Basic field validations.
    if (!formData.name) {
      return addToast({
        title: "Missing Name",
        description: "Please enter the trainer's name.",
        color: "danger",
        timeout: 2500,
      });
    }
    if (!formData.session) {
      return addToast({
        title: "Missing Session",
        description: "Please enter the number of sessions.",
        color: "danger",
        timeout: 2500,
      });
    }
    if (!formData.price) {
      return addToast({
        title: "Missing Price",
        description: "Please enter the price.",
        color: "danger",
        timeout: 2500,
      });
    }
    if (!formData.features) {
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

    // Check if any data has changed compared to the initial fetched data.
    if (initialData) {
      const isUnchanged =
        formData.name === initialData.name &&
        formData.session === initialData.session &&
        formData.price === initialData.price &&
        formData.features === initialData.features &&
        formData.status === initialData.status &&
        // If both images are strings, compare them. Otherwise, if the image is a File, it's considered changed.
        (typeof formData.image === "string" &&
          typeof initialData.image === "string"
          ? formData.image === initialData.image
          : false);

      if (isUnchanged) {
        setLoading(false);
        return addToast({
          title: "No Changes Detected",
          description: "No changes to update.",
          color: "warning",
          timeout: 2500,
        });
      }
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return addToast({
        title: "Unauthorized",
        description: "Session expired. Please log in again.",
        color: "danger",
        timeout: 2500,
      });
    }

    // Create FormData for file upload alongside other fields.
    const data = new FormData();
    data.append("name", formData.name);
    data.append("session", formData.session);
    data.append("price", formData.price);
    data.append("features", formData.features);
    data.append("status", formData.status);
    // Append the method override so Laravel treats this as a PUT request.
    data.append("_method", "PUT");
    // Append new file if chosen; if not, leave image unchanged.
    if (formData.image && typeof formData.image !== "string") {
      data.append("image", formData.image);
    }

    try {
      // Use axios.post with the _method override.
      await axios.post(
        `${API_BASE}/api/personal_trainers/${personalTrainerId}`,
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            // Let the browser set the correct Content-Type header for FormData.
          },
          withCredentials: true,
        }
      );

      addToast({
        title: "Personal Trainer Updated",
        description: "Record updated successfully!",
        color: "success",
        timeout: 2500,
      });

      onPersonalTrainerUpdated();
      onClose();
    } catch (err: any) {
      console.error(
        "❌ Error updating personal trainer:",
        err.response?.data || err.message
      );
      addToast({
        title: "Failed to Update",
        description:
          err.response?.data?.message || "An error occurred. Please try again.",
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
      classNames={{ backdrop: "bg-black/5" }}
    >
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader className="flex justify-between">
              <h2 className="text-xl font-bold">Edit Personal Trainer</h2>
            </ModalHeader>
            <ModalBody>
              {error && (
                <p className="text-red-500 text-sm text-center mb-4">{error}</p>
              )}
              {/* New Name field */}
              <div className="mb-4">
                <Input
                  label="Name"
                  name="name"
                  placeholder="Enter trainer's name"
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
                  {typeof formData.image === "string" && formData.image && (
                    <img
                      src={formData.image}
                      alt="Current"
                      className="mt-2 w-16 h-16 object-cover"
                    />
                  )}
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
                {loading ? "Updating..." : "Update Personal Trainer"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default EditPersonalTrainerModal;
