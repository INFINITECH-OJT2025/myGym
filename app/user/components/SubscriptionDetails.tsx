"use client";

import { useEffect, useState } from "react";
import { Input, DatePicker } from "@heroui/react";
import axios from "axios";
import { format } from "date-fns";

const API_BASE = "http://127.0.0.1:8000";

interface SubscriptionProps {
  subscriptionId: string | null;
  startDate: Date | null;
  setStartDate: (date: Date | null) => void;
  endDate: string;
  setEndDate: (date: string) => void;
}

export default function SubscriptionDetails({
  subscriptionId,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
}: SubscriptionProps) {
  const [subscription, setSubscription] = useState<any>(null);

  useEffect(() => {
    if (subscriptionId) {
      fetchSubscription(subscriptionId);
    }
  }, [subscriptionId]);

  const fetchSubscription = async (id: string) => {
    try {
      const response = await axios.get(`${API_BASE}/api/subscriptions/${id}`);
      setSubscription(response.data);
    } catch (error) {
      console.error("Error fetching subscription:", error);
    }
  };

  const computeEndDate = (selectedDate: Date) => {
    if (!subscription) return;

    let calculatedEndDate = new Date(selectedDate);

    switch (subscription.duration) {
      case "daily":
        calculatedEndDate.setDate(selectedDate.getDate() + 1);
        break;
      case "weekly":
        calculatedEndDate.setDate(selectedDate.getDate() + 7);
        break;
      case "monthly":
        calculatedEndDate.setMonth(selectedDate.getMonth() + 1);
        break;
      case "yearly":
        calculatedEndDate.setFullYear(selectedDate.getFullYear() + 1);
        break;
      case "lifetime":
        setEndDate("Lifetime Access");
        return;
    }

    setEndDate(format(calculatedEndDate, "MMMM d, yyyy"));
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold">📜 Subscription Details</h2>

      {subscription ? (
        <div className="bg-gray-100 p-4 rounded-lg shadow-sm">
          <label className="block text-gray-700 font-medium">Plan Name</label>
          <Input value={subscription.plan_name} disabled className="mb-2" />

          <label className="block text-gray-700 font-medium">Price</label>
          <Input value={`₱${subscription.price}`} disabled className="mb-2" />

          <label className="block text-gray-700 font-medium">Duration</label>
          <Input value={subscription.duration} disabled className="mb-2" />

          <label className="block text-gray-700 font-medium">Start Date</label>
          <DatePicker
            selected={startDate}
            onChange={(date: any) => {
              const newDate = new Date(date);
              setStartDate(newDate);
              computeEndDate(newDate);
            }}
            minDate={new Date()}
            placeholder="Select Start Date"
          />

          <label className="block text-gray-700 font-medium mt-4">End Date</label>
          <Input value={endDate} disabled placeholder="End date will appear here" />
        </div>
      ) : (
        <p className="text-gray-600">Loading subscription details...</p>
      )}
    </div>
  );
}
