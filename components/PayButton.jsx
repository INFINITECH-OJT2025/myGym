"use client";

import { useState } from "react";
import { createGcashPayment } from "../api/paymongo";

export default function PayButton() {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        const email = "user@example.com"; // Replace with dynamic user email
        const amount = 100; // Example amount in PHP

        const data = await createGcashPayment(amount, email);
        
        if (data.checkout_url) {
            window.location.href = data.checkout_url;
        } else {
            alert("Payment failed!");
        }

        setLoading(false);
    };

    return (
        <button
            onClick={handlePayment} 
            disabled={loading}
            className="bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600"
        >
            {loading ? "Processing..." : "Pay with GCash"}
        </button>
    );
}
