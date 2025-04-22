"use client";

import { useState, useEffect } from "react";
import { Button } from "@heroui/button";
import Sidebar from "@/components/sidebar_admin";
import axios from "axios";
import type { AxiosResponse } from "axios/index";

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  features: string[];
}

const PricingPage = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<number | null>(null);
  const [editedPlan, setEditedPlan] = useState<Partial<SubscriptionPlan>>({});

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = () => {
    axios
      .get<SubscriptionPlan[]>("http://localhost:8000/api/subscriptions")
      .then((response) => setPlans(response.data))
      .catch((error) => console.error("Error fetching plans:", error));
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof SubscriptionPlan) => {
    setEditedPlan((prev) => ({
      ...prev,
      [field]: field === "price" ? parseFloat(e.target.value) || 0 : e.target.value,
    }));
  };

  const handleFeaturesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value.trim();
    setEditedPlan((prev) => ({
      ...prev,
      features: value ? value.split(",").map((feature) => feature.trim()) : [],
    }));
  };

  const startEditing = (plan: SubscriptionPlan) => {
    setEditingPlan(plan.id);
    setEditedPlan({
      ...plan,
      features: Array.isArray(plan.features) ? plan.features : [],
    });
  };

  const cancelEditing = () => {
    setEditingPlan(null);
    setEditedPlan({});
  };

  const saveChanges = (id: number) => {
    axios
      .put(`http://localhost:8000/api/subscriptions/${id}`, {
        name: editedPlan.name,
        price: editedPlan.price,
        features: editedPlan.features,
      })
      .then(() => {
        setPlans((prev) => prev.map((plan) => (plan.id === id ? { ...plan, ...editedPlan } : plan)));
        setEditingPlan(null);
        return axios.post("http://localhost:8000/api/update-user-subscriptions", { plan_id: id });
      })
      .then(() => {
        alert("Plan updated and users notified successfully!");
      })
      .catch((error) => console.error("Update failed:", error));
  };

  const deletePlan = (id: number) => {
    axios
      .delete(`http://localhost:8000/api/subscriptions/${id}`)
      .then(() => {
        fetchPlans();
        alert("Deleted successfully");
      })
      .catch((error) => console.error("Delete failed:", error));
  };

  return (
    <section className="flex flex-col lg:flex-row">
      <Sidebar />
      <div className="w-full p-4">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Manage Subscription Plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 min-w-[600px] md:min-w-full">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-3 text-left">#</th>
                <th className="border p-3 text-left">Plan Name</th>
                <th className="border p-3 text-left">Price (₱)</th>
                <th className="border p-3 text-left">Features</th>
                <th className="border p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, index) => (
                <tr key={plan.id} className="border-b bg-white hover:bg-gray-50 transition">
                  <td className="border p-3">{index + 1}</td>
                  <td className="border p-3">
                    {editingPlan === plan.id ? (
                      <input type="text" value={editedPlan.name || ""} onChange={(e) => handleEditChange(e, "name")} className="border rounded px-2 py-1 w-full" />
                    ) : (
                      plan.name
                    )}
                  </td>
                  <td className="border p-3">
                    {editingPlan === plan.id ? (
                      <input type="number" value={editedPlan.price?.toString() || ""} onChange={(e) => handleEditChange(e, "price")} className="border rounded px-2 py-1 w-full" />
                    ) : (
                      `₱${plan.price}/mo`
                    )}
                  </td>
                  <td className="border p-3">
                    {editingPlan === plan.id ? (
                      <textarea value={(editedPlan.features || []).join(", ")} onChange={handleFeaturesChange} className="border rounded px-2 py-1 w-full" />
                    ) : (
                      <ul className="list-disc pl-4 text-sm">
                        {plan.features.map((feature, i) => (
                          <li key={i}>{feature}</li>
                        ))}
                      </ul>
                    )}
                  </td>
                  <td className="border p-3 flex flex-col sm:flex-row gap-2">
                    {editingPlan === plan.id ? (
                      <>
                        <Button className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-800" onClick={() => saveChanges(plan.id)}>
                          Save
                        </Button>
                        <Button className="bg-gray-500 text-white px-3 py-1 rounded-lg hover:bg-gray-700" onClick={cancelEditing}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-800" onClick={() => startEditing(plan)}>
                          Edit
                        </Button>
                        <Button className="bg-red-600 text-white px-3 py-1 rounded-lg hover:bg-red-800" onClick={() => deletePlan(plan.id)}>
                          Delete
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default PricingPage;
