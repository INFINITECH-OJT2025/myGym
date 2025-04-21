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
  addToast,
} from "@heroui/react";
import axios, { AxiosError } from "axios";

// Use process.env for the API base URL
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface AddClassTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClassTypeAdded?: (classType: any) => void;
}

export default function AddClassTypeModal({
  isOpen,
  onClose,
  onClassTypeAdded,
}: AddClassTypeModalProps) {
  const [name, setName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle image file selection and preview creation.
  interface ImageChangeEvent extends React.ChangeEvent<HTMLInputElement> {
    target: HTMLInputElement & {
      files: FileList | null;
    };
  }

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setName("");
      setPreviewUrl("");
    }
  }, [isOpen]);

  const handleImageChange = (e: ImageChangeEvent) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Handle form submission to add a new class type.
  const handleSubmit = async () => {
    if (!name.trim()) {
      addToast({
        title: "Error",
        description: "Class Type is required",
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
      const response = await axios.post(
        `${API_BASE}/api/class-types`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: token ? `Bearer ${token}` : "",
          },
        }
      );
      addToast({
        title: "Success",
        description: "Class Type added successfully",
        color: "success",
        timeout: 3000,
      });
      if (onClassTypeAdded) onClassTypeAdded(response.data);
      // Reset form data
      setName("");
      setImageFile(null);
      setPreviewUrl("");
      onClose();
    } catch (err) {
      if ((err as AxiosError).isAxiosError) {
        const axiosError = err as AxiosError;
        console.error(
          "Error adding class type:",
          axiosError.response?.data || axiosError.message
        );
      } else {
        console.error("Error adding class type:", String(err));
      }
      addToast({
        title: "Error",
        description: "Failed to add class type",
        color: "danger",
        timeout: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Main Modal for adding a new class type */}
      <Modal
        isOpen={isOpen}
        onOpenChange={(open) => {
          // When modal closes, clear inputs and call onClose.
          if (!open) {
            setName("");
            setPreviewUrl("");
            onClose();
          }
        }}
        className={isMobile ? " items-center justify-center" : ""}
      >
        <ModalContent>
          <ModalHeader>Add Class Type</ModalHeader>
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
                  onClick={() => setShowImageModal(true)}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              onPress={() => {
                // Clear inputs and close modal.
                setName("");
                setPreviewUrl("");
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button color="primary" onPress={handleSubmit} isLoading={loading}>
              Add Class Type
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Secondary Modal for enlarged image preview */}
      {showImageModal && (
        <Modal
          isOpen={showImageModal}
          onOpenChange={() => setShowImageModal(false)}
          className={
            isMobile ? "fixed inset-0 flex items-center justify-center" : ""
          }
        >
          <ModalContent>
            <ModalHeader>Image Preview</ModalHeader>
            <ModalBody>
              <img
                src={previewUrl}
                alt="Enlarged Preview"
                className="w-full h-auto"
              />
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </>
  );
}
