"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Modal, ModalContent, Button, Input } from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface EditRewardModalProps {
  isOpen: boolean;
  rewardId: number | null;
  onClose: () => void;
  onRewardUpdated: () => void;
}

interface Reward {
  id: number;
  item: string;
  cost_points: number;
  image: string;
}

export default function EditRewardModal({
  isOpen,
  rewardId,
  onClose,
  onRewardUpdated,
}: EditRewardModalProps) {
  const [item, setItem] = useState("");
  const [costPoints, setCostPoints] = useState<number | undefined>(undefined);
  const [currentImage, setCurrentImage] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReward = async () => {
    if (!rewardId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get<Reward>(`${API_BASE}/api/rewards/${rewardId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          Accept: "application/json",
        },
      });
      const reward = response.data;
      setItem(reward.item);
      setCostPoints(reward.cost_points);
      setCurrentImage(reward.image);
    } catch (err: any) {
      setError(err.message || "Failed to fetch reward details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rewardId && isOpen) {
      fetchReward();
    }
  }, [rewardId, isOpen]);

  // Reset modal state when it's closed
  useEffect(() => {
    if (!isOpen) {
      setItem("");
      setCostPoints(undefined);
      setCurrentImage("");
      setImageFile(null);
      setError("");
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Frontend validation
    if (!item.trim()) {
      setError("Reward item is required.");
      setLoading(false);
      return;
    }

    if (costPoints === undefined || isNaN(costPoints)) {
      setError("Cost points are required and must be a number.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      // If an image file is provided, use FormData with _method override.
      if (imageFile) {
        const formData = new FormData();
        formData.append("_method", "PUT");
        formData.append("item", item);
        formData.append("cost_points", costPoints.toString());
        formData.append("image", imageFile);

        await axios.post(`${API_BASE}/api/rewards/${rewardId}`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
      } else {
        // Otherwise, send JSON payload with a proper PUT request.
        await axios.put(
          `${API_BASE}/api/rewards/${rewardId}`,
          { item, cost_points: costPoints },
          {
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }
        );
      }

      onRewardUpdated();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update reward.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onClose}
      placement="center"
      classNames={{ backdrop: "bg-black/70" }}
    >
      <ModalContent>
        <div className="p-4">
          <h2 className="text-xl font-bold mb-4">Edit Reward</h2>
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
                onChange={(e) => setCostPoints(e.target.valueAsNumber)}
                placeholder="Enter cost points"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-1">Current Image</label>
              {currentImage ? (
                <img
                  src={currentImage}
                  alt="Current Reward"
                  className="w-16 h-16 object-cover rounded mb-2"
                />
              ) : (
                <p>No image available.</p>
              )}
              <label className="block text-gray-700 mb-1">
                Change Image (optional)
              </label>
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" color="secondary" onPress={onClose} disabled={loading}>
                Cancel
              </Button>
              <Button type="submit" variant="solid" color="primary" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </ModalContent>
    </Modal>
  );
}
