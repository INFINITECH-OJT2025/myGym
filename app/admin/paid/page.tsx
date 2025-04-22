"use client";
import { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar_admin";

interface Payment {
  id: number;
  user_id: number;
  plan_id: number;
  price: number;
  status: string;
  reference_number: string;
  image: string | null;
  user: {
    name: string;
    email: string;
  };
  subscription: {
    name: string;
  };
}

const AdminPaid = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        await fetch("http://localhost:8000/sanctum/csrf-cookie", {
          credentials: "include",
        });

        const res = await fetch("http://localhost:8000/api/admin/payments", {
          credentials: "include",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json",
          },
        });

        if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

        const data = await res.json();
        setPayments(data);
      } catch (error) {
        console.error("Error fetching payments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, []);

  const approvePayment = async (paymentId: number) => {
    if (!window.confirm("Are you sure you want to approve this payment?")) return;

    try {
      const res = await fetch(`http://localhost:8000/api/admin/payments/${paymentId}/status`, {
        method: "PUT",
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "approved" }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

      setPayments((prevPayments) =>
        prevPayments.map((p) => (p.id === paymentId ? { ...p, status: "approved" } : p))
      );

      alert("Payment approved successfully!");
    } catch (error) {
      console.error("Error approving payment:", error);
      alert("Failed to approve payment.");
    }
  };

  return (
    <div className="flex">
      <Sidebar />
      <div className="p-6 w-full">
        <h1 className="text-2xl font-bold mb-4">User Payments</h1>

        {loading ? (
          <p>Loading payments...</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">User</th>
                <th className="border p-2">Email</th>
                <th className="border p-2">Plan</th>
                <th className="border p-2">Price</th>
                <th className="border p-2">Status</th>
                <th className="border p-2">Reference #</th>
                <th className="border p-2">Image</th>
                <th className="border p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} className="text-center">
                  <td className="border p-2">{payment.user.name}</td>
                  <td className="border p-2">{payment.user.email}</td>
                  <td className="border p-2">{payment.subscription?.name || "N/A"}</td>
                  <td className="border p-2">₱{payment.price}</td>
                  
                  <td className="border p-2">{payment.reference_number}</td>
                  <td className="border p-2">
                    {payment.image ? (
                      <a href={payment.image} target="_blank" rel="noopener noreferrer">
                        <img src={payment.image} alt="Receipt" className="h-12 mx-auto" />
                      </a>
                    ) : (
                      "No Image"
                    )}
                  </td>
                  <td className={`border p-2 ${payment.status === "approved" ? "text-green-600" : "text-red-600"}`}>
                    {payment.status === "approved" ? "Approved ✅" : "Not Approved ❌"}
                  </td>
                  <td className="border p-2">
                    {payment.status !== "approved" && (
                      <button
                        onClick={() => approvePayment(payment.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPaid;
