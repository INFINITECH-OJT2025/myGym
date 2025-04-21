"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button, Spinner } from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export interface Reward {
  id: number;
  item: string;
  image: string;
  cost_points: number;
}

interface RedeemPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Callback that fires when a reward is redeemed.
  onRedeem?: (reward: Reward) => void;
}

export default function RedeemPointsModal({
  isOpen,
  onClose,
  onRedeem,
}: RedeemPointsModalProps) {
  const [redeemRewards, setRedeemRewards] = useState<Reward[]>([]);
  const [redeemRewardsLoading, setRedeemRewardsLoading] = useState<boolean>(false);
  const [redeemRewardsError, setRedeemRewardsError] = useState<string>("");

  const fetchRedeemRewards = async () => {
    try {
      setRedeemRewardsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setRedeemRewardsError("User is not authenticated.");
        return;
      }
      const response = await axios.get<Reward[]>(`${API_BASE}/api/rewards`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      setRedeemRewards(response.data);
    } catch (err: any) {
      setRedeemRewardsError(err.response?.data?.message || "Failed to fetch rewards.");
    } finally {
      setRedeemRewardsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRedeemRewards();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>
      {/* Modal Content */}
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-11/12 md:w-1/2 z-10">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
          Redeem Your Points for Rewards
        </h2>
        {redeemRewardsLoading ? (
          <div className="flex justify-center items-center">
            <Spinner />
          </div>
        ) : redeemRewardsError ? (
          <p className="text-red-500">{redeemRewardsError}</p>
        ) : redeemRewards.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {redeemRewards.map((reward) => (
              <div
                key={reward.id}
                className="border p-4 rounded-lg flex flex-col items-center"
              >
                <img
                  src={reward.image}
                  alt={reward.item}
                  className="w-full max-h-32 object-cover rounded mb-2"
                />
                <h3 className="font-bold">{reward.item}</h3>
                <p className="text-sm mb-2">Cost: {reward.cost_points} points</p>
                <Button
                  onPress={() => {
                    if (onRedeem) {
                      onRedeem(reward);
                    }
                  }}
                >
                  Redeem
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">
            No rewards available for redemption.
          </p>
        )}
        <div className="mt-4 flex justify-end">
          <Button variant="solid" color="primary" onPress={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
