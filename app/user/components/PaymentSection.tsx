"use client";

import { Select, SelectItem, Input, Button } from "@heroui/react";
import { useState } from "react";

export default function PaymentSection() {
  const [referenceNumber, setReferenceNumber] = useState("");

  return (
    <div className="bg-white shadow-lg rounded-lg p-6">
      <h2 className="text-xl font-bold">💳 Payment Details</h2>

      <Select label="Payment Method">
        <SelectItem key="gcash">Gcash</SelectItem>
        <SelectItem key="paymaya">PayMaya</SelectItem>
        <SelectItem key="paypal">PayPal</SelectItem>
      </Select>

      <Input
        label="Reference Number"
        placeholder="Enter reference number"
        value={referenceNumber}
        onChange={(e) => setReferenceNumber(e.target.value)}
      />

      <Button color="primary" className="mt-4 w-full">
        Submit Payment
      </Button>
    </div>
  );
}
