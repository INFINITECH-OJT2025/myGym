"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";

const Payment = () => {
  const searchParams = useSearchParams();

  // Extract URL parameters
  const planId = searchParams.get("plan_id") || "";
  const planName = searchParams.get("plan_name") || "";
  const price = searchParams.get("price") || "";

  // Form State
  const [formData, setFormData] = useState({
    user_id: "", // To be fetched from API
    full_name: "", // To be fetched from API
    email: "", // To be fetched from API
    contact_number: "",
    birthday: "",
    address: "",
    gym_address: "",
    payment_method: "",
    reference_number: "",
    image: null as File | null,
  });

  const [loading, setLoading] = useState(false);

  // Fetch user details from API
  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in.");
        return;
      }

      try {
        const res = await fetch("http://localhost:8000/api/user", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok) {
          setFormData((prev) => ({
            ...prev,
            user_id: data.user_id,
            full_name: data.name,
            email: data.email,
          }));
        } else {
          alert("Failed to fetch user data.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        alert("Something went wrong!");
      }
    };

    fetchUserData();
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; 
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!formData.contact_number) {
      alert("Please enter your contact number.");
      return;
    }
    if (!formData.image) {
      alert("Please upload proof of payment.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to proceed.");
      setLoading(false);
      return;
    }

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          formDataObj.append(key, value instanceof File ? value : String(value));
        }
      });
      formDataObj.append("plan_id", planId);
      formDataObj.append("plan_name", planName);
      formDataObj.append("price", price);

      const res = await fetch("http://localhost:8000/api/payment", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataObj,
      });

      const data = await res.json();
      if (res.ok) {
        alert("Payment successful!");
      } else {
        alert("Payment failed: " + data.message);
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment grid md:grid-cols-5 grid-cols-1 md:grid-rows-5 grid-rows-auto gap-4 p-4">
      {/* User Credentials */}
      <div className="div1 md:col-span-3 col-span-full md:row-span-5 p-6 rounded-lg shadow border-2 border-blue-600">
        <h2 className="text-xl font-bold mb-4 text-blue-500">User Credentials</h2>
        {[ 
          { label: "User ID", name: "user_id", type: "text", placeholder: "User ID", disabled: true },
          { label: "Full Name", name: "full_name", type: "text", placeholder: "Enter your full name", disabled: true },
          { label: "Email", name: "email", type: "email", placeholder: "Enter your email", disabled: true },
          { label: "Contact Number", name: "contact_number", type: "text", placeholder: "Enter your contact number", required: true },
          { label: "Birthday", name: "birthday", type: "date", placeholder: "Enter your birthday", required: false },
          { label: "Address", name: "address", type: "text", placeholder: "Enter your address", required: false },
          { label: "Gym Address", name: "gym_address", type: "text", placeholder: "Enter gym address", required: false },
        ].map((field, index) => (
          <div key={index} className="mb-2">
            <label className="block text-sm font-medium">{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              className="w-full p-2 border rounded"
              onChange={handleInputChange}
              value={formData[field.name as keyof typeof formData] as string || ""}
              disabled={field.disabled}
            />
          </div>
        ))}
      </div>

      {/* Payment Section */}
      <div className="div2 md:col-span-2 col-span-full md:row-span-5 bg-white p-6 border rounded-lg border-2 border-blue-600">
        <h1 className="text-2xl font-bold text-blue-500">Payment Page</h1>
        {planId ? (
          <div>
            <p>Plan: {planName}</p>
            <p>Price: ${price}/mo</p>

            <div className="mt-4">
              <label className="block text-sm font-medium">Payment Method</label>
              <select name="payment_method" onChange={handleInputChange} className="w-full p-2 border rounded">
                <option value="">Select Payment Method</option>
                <option value="gcash">GCash</option>
                <option value="paypal">PayPal</option>
                <option value="paymaya">PayMaya</option>
                <option value="debit">Debit/Credit Card</option>
              </select>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium">Reference Number</label>
              <input type="text" name="reference_number" placeholder="Enter reference number" className="w-full p-2 border rounded" onChange={handleInputChange} />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium">Upload Proof of Payment</label>
              <input type="file" className="w-full p-2 border rounded" onChange={handleFileChange} />
            </div>

            <button onClick={handleSubmit} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition" disabled={loading}>
              {loading ? "Processing..." : "Proceed to Payment"}
            </button>
          </div>
        ) : (
          <p>No plan selected.</p>
        )}
      </div>
    </div>
  );
};

export default Payment;
