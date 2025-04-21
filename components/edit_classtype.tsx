"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  addToast,
} from "@heroui/react";
import axios, { AxiosError } from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface EditClassTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  // The existing class type data to edit.
  classType: {
    id: number;
    name: string;
    image: string;
  };
  onClassTypeUpdated?: (updatedClassType: any) => void;
}

export default function EditClassTypeModal({
  isOpen,
  onClose,
  classType,
  onClassTypeUpdated,
}: EditClassTypeModalProps) {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile devices (example breakpoint: 768px)
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // When modal opens, initialize the form with the class type data.
  useEffect(() => {
    if (isOpen && classType) {
      setName(classType.name);
      // Create a full URL for previewing the existing image.
      setPreviewUrl(`${API_BASE}${classType.image}`);
    }
  }, [isOpen, classType]);

  // Clear inputs when modal closes.
  useEffect(() => {
    if (!isOpen) {
      setName("");
      setImageFile(null);
      setPreviewUrl("");
    }
  }, [isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      addToast({
        title: "Error",
        description: "Class Type name is required",
        color: "danger",
        timeout: 3000,
      });
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    if (imageFile) {
      formData.append("image", imageFile, imageFile.name);
    }

    try {
      const token = localStorage.getItem("token");
      formData.append("_method", "PUT");
      const response = await axios.post(
        `${API_BASE}/api/class-types/${classType.id}`,
        formData,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );

      addToast({
        title: "Success",
        description: "Class Type updated successfully",
        color: "success",
        timeout: 3000,
      });
      if (onClassTypeUpdated) onClassTypeUpdated(response.data);
      onClose();
    } catch (err) {
      if ((err as AxiosError).isAxiosError) {
        const axiosError = err as AxiosError;
        console.error(
          "Error updating class type:",
          axiosError.response?.data || axiosError.message
        );
      } else {
        console.error("Error updating class type:", String(err));
      }
      addToast({
        title: "Error",
        description: "Failed to update class type",
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      className={
        isMobile ? "fixed inset-0 flex items-center justify-center" : ""
      }
    >
      <ModalContent>
        <ModalHeader>Edit Class Type</ModalHeader>
        <ModalBody>
          <Input
            label="Class Type"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter class type name"
          />
          <Input
            type="file"
            label="Image"
            onChange={handleImageChange}
            accept="image/*"
          />
          {previewUrl && (
            <div className="mt-4">
              <img
                src={previewUrl}
                alt="Preview"
                className="w-32 h-32 object-cover cursor-pointer"
                // Optionally, you can open a larger preview here.
                onClick={() => {}}
              />
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            onPress={() => {
              onClose();
            }}
          >
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit} isLoading={loading}>
            Update Class Type
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
