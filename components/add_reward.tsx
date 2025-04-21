"use client";

import { useState } from "react";
import axios from "axios";
import { Modal, ModalContent, Button, Input } from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface AddRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardAdded: () => void;
}

export default function AddRewardModal({ isOpen, onClose, onRewardAdded }: AddRewardModalProps) {
  const [item, setItem] = useState("");
  const [costPoints, setCostPoints] = useState<number | undefined>(undefined);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      const formData = new FormData();
      formData.append("item", item);
      formData.append("cost_points", costPoints?.toString() || "");
      if (imageFile) {
        formData.append("image", imageFile);
      }

      const token = localStorage.getItem("token");

      await axios.post(`${API_BASE}/api/rewards`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      onRewardAdded(); // Callback to refresh rewards in your dashboard/parent component.
      onClose();
      // Reset form inputs
      setItem("");
      setCostPoints(undefined);
      setImageFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to add reward");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} placement="center" classNames={{ backdrop: "bg-black/70" }}>
      <ModalContent>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Add New Reward</h2>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-1">Reward Item</label>
              <Input
                value={item}
                onChange={(e) => setItem(e.target.value)}
                placeholder="Enter reward item"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Cost Points</label>
              <Input
                type="number"
                value={costPoints !== undefined ? String(costPoints) : ""}
                onChange={(e) => setCostPoints(parseInt(e.target.value))}
                placeholder="Enter cost points"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Reward Image</label>
              <input type="file" accept="image/*" onChange={handleFileChange} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" color="secondary" onPress={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="solid" color="primary" disabled={loading}>
                {loading ? "Adding..." : "Add Reward"}
              </Button>
            </div>
          </form>
        </div>
      </ModalContent>
    </Modal>
  );
}
