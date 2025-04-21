"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Button, Spinner } from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface PointsHistory {
  id: number;
  date: string;
  description: string;
  points: number;
  reward_name: string;
}

interface RedemptionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  pointsHistory: PointsHistory[],
}

export default function RedemptionHistoryModal({
  isOpen,
  onClose,
}: RedemptionHistoryModalProps) {
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const fetchPointsHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        setError("User is not authenticated.");
        return;
      }
      const response = await axios.get<PointsHistory[]>(
        `${API_BASE}/api/points-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      console.log("Raw points history:", response.data); // Debug log

      // Filter transactions where the points (converted to number) are negative.
      const redemptionHistory = response.data.filter(
        (transaction) => Number(transaction.points) < 0
      );
      setPointsHistory(redemptionHistory);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to fetch redemption history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPointsHistory();
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
          Redemption History
        </h2>
        {loading ? (
          <div className="flex justify-center items-center">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : pointsHistory.length > 0 ? (
          <ul className="max-h-60 overflow-y-auto">
            {pointsHistory.map((tx) => (
              <li key={tx.id} className="mb-4 border-b pb-2">
                <p>
                  <strong>Date:</strong>{" "}
                  {new Date(tx.date).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <p>
                  <strong>Reward:</strong> {tx.reward_name}
                </p>
                <p>
                  <strong>Points Redeemed:</strong> {Math.abs(tx.points)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-700 dark:text-gray-300">
            No redemption history available.
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
