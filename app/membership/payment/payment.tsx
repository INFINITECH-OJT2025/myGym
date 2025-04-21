"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Form,
  Input,
  Button,
  Select,
  SelectItem,
  useDisclosure,
  DatePicker,
  addToast,
} from "@heroui/react";
import axios from "axios";
import Image from "next/image";
import { format } from "date-fns";
import TriggerModal from "@/components/trigger_modal";
import { CheckCircle } from "lucide-react";
import { today, getLocalTimeZone } from "@internationalized/date";

const API_BASE = "http://127.0.0.1:8000";

export default function Payment() {
  const searchParams = useSearchParams();
  // Get personal trainer id from URL query parameters.
  const personalTrainerId = searchParams.get("personalTrainerId");

  const [isClient, setIsClient] = useState(false); // Prevent SSR issues

  // Personal Trainer Interface.
  interface PersonalTrainer {
    id: number;
    name: string;
    session: number;
    price: number;
    features: string;
    image: string;
    status: "show" | "hide";
  }

  // Payment Method Interface.
  interface PaymentMethod {
    id: number; // using id here is recommended
    name: string;
    qr_code?: string;
  }

  // User can be any object (adjust properties as needed).
  const [user, setUser] = useState<any>(null);
  const [personalTrainer, setPersonalTrainer] = useState<PersonalTrainer | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  // Payment form states.
  const [referenceNumber, setReferenceNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Date states.
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<string>("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { isOpen, onOpen } = useDisclosure();

  // Run only on client.
  useEffect(() => {
    setIsClient(true);

    const fetchData = async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          setError("User is not authenticated. Please log in.");
          return;
        }

        // Fetch user details, payment methods, and personal trainer details.
        const [userRes, paymentMethodsRes, personalTrainerRes] =
          await Promise.all([
            axios.get(`${API_BASE}/api/user`, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
              withCredentials: true,
            }),
            axios.get(`${API_BASE}/api/payment-methods`, {
              headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/json",
              },
              withCredentials: true,
            }),
            personalTrainerId
              ? axios.get(`${API_BASE}/api/personal_trainers/${personalTrainerId}`, {
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/json",
                  },
                })
              : Promise.resolve({ data: null }),
          ]);

        setUser(userRes.data);
        setPaymentMethods(paymentMethodsRes.data as PaymentMethod[]);
        setPersonalTrainer(personalTrainerRes.data as PersonalTrainer);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      }
    };

    fetchData();
  }, [personalTrainerId]);

  /** Compute End Date based on startDate. 
      Here we assume a default duration calculation (e.g., monthly) for personal trainer subscriptions.
      Modify this logic if personal trainer subscriptions follow different rules. */
  useEffect(() => {
    if (!personalTrainer || !startDate) return;
    let calculatedEndDate = new Date(startDate);
    // For example, default to one month later.
    calculatedEndDate.setMonth(startDate.getMonth() + 1);
    setEndDate(format(calculatedEndDate, "MMMM d, yyyy"));
  }, [personalTrainer, startDate]);

  /** Handle Payment Method Change */
  const handlePaymentMethodChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    const selectedMethod = paymentMethods.find(
      (method) => method.name === selectedKey
    );
    setSelectedPaymentMethod(selectedMethod || null);
  };

  /** Validate Reference Number */
  const validateReferenceNumber = (value: string) => {
    if (!selectedPaymentMethod) return null;
    switch (selectedPaymentMethod.name) {
      case "Gcash":
        return /^\d{13}$/.test(value)
          ? null
          : "❌ GCash reference number must be 13 digits.";
      case "PayMaya":
        return /^\d{12}$/.test(value)
          ? null
          : "❌ PayMaya reference number must be 12 digits.";
      case "PayPal":
        return value.length === 17
          ? null
          : "❌ PayPal reference number must be 17 characters.";
      case "Credit/Debit":
        return /^\d{12,18}$/.test(value)
          ? null
          : "❌ Credit/Debit reference must be between 12-18 digits.";
      default:
        return null;
    }
  };

  /** Handle File Upload */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      if (!file.type.startsWith("image/")) {
        addToast({
          title: "Error",
          description: "Please upload a valid image file.",
          color: "danger",
          variant: "flat",
          radius: "full",
          timeout: 2000,
          hideIcon: true,
          classNames: { closeButton: "show" },
        });
        return;
      }
      setSelectedFile(file);
      setUploadedImage(URL.createObjectURL(file));
    }
  };

  /** Cleanup uploaded image URL to prevent memory leaks */
  useEffect(() => {
    return () => {
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage);
      }
    };
  }, [uploadedImage]);

  /** Handle Payment Submission */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate reference number if provided.
    const validationError = validateReferenceNumber(referenceNumber);
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!selectedPaymentMethod) {
      addToast({
        title: "Error",
        description: "Please select a payment method.",
        color: "danger",
        variant: "flat",
        radius: "full",
        timeout: 2000,
        hideIcon: true,
        classNames: { closeButton: "show" },
      });
      return;
    }
    if (!referenceNumber) {
      addToast({
        title: "Error",
        description: "Please enter the reference number.",
        color: "danger",
        variant: "flat",
        radius: "full",
        timeout: 2000,
        hideIcon: true,
        classNames: { closeButton: "show" },
      });
      return;
    }
    // Validate file upload.
    if (!selectedFile) {
      addToast({
        title: "Error",
        description: "Please upload proof of payment.",
        color: "danger",
        variant: "flat",
        radius: "full",
        timeout: 2000,
        hideIcon: true,
        classNames: { closeButton: "show" },
      });
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Optionally, check if the reference number already exists.
      const refCheckRes = await axios.get(`${API_BASE}/api/payments/check-ref/${referenceNumber}`);
      if ((refCheckRes.data as { exists: boolean }).exists) {
        addToast({
          title: "Duplicate Reference",
          description: "This reference number already exists. Please use a unique one.",
          color: "danger",
          variant: "flat",
          radius: "full",
          timeout: 3000,
          hideIcon: true,
          classNames: { closeButton: "show" },
        });
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("user_id", user.id);
      // Use personal trainer id for payments.
      if (personalTrainer) {
        formData.append("personal_trainers_id", personalTrainer.id.toString());
        formData.append("amount", personalTrainer.price.toString());
      }
      // Here we send the payment method id if available; for now, we send the name.
      formData.append("payment_method.id", selectedPaymentMethod.id.toString());
      formData.append("reference_number", referenceNumber);
      // If a start date is required, append it.
      if (startDate) {
        formData.append("start_date", format(startDate, "yyyy-MM-dd"));
      }
      if (uploadedImage) formData.append("image", selectedFile);

      await axios.post(`${API_BASE}/api/payments_personal`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      addToast({
        title: "Payment Successful",
        description: "Your payment was successful. Thank you for your purchase!",
        color: "success",
        variant: "flat",
        radius: "full",
        timeout: 2000,
        hideIcon: true,
        classNames: { closeButton: "show" },
      });

      onOpen();
    } catch (err: any) {
      setError("❌ Payment failed. Please try again.");
      addToast({
        title: "Error",
        description: "Payment failed. Please try again.",
        color: "danger",
        variant: "flat",
        radius: "full",
        timeout: 2000,
        hideIcon: true,
        classNames: { closeButton: "show" },
      });
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration mismatch.
  if (!isClient) return null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-6 bg-gray-100 dark:bg-gray-900 min-h-screen relative">
        <TriggerModal />

        {/* Content Wrapper */}
        <div className="flex flex-col lg:flex-row gap-4 lg:col-span-5">
          {/* Main Section */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 w-full lg:w-3/5">
            <h1 className="text-3xl font-bold text-primary text-center text-gray-900 dark:text-gray-100">
              Welcome to Fit & Gym!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-center italic mb-4">
              "Every journey begins with a single step. Take yours today and embrace a healthier lifestyle!"
            </p>

            {/* Personal Trainer Subscription Details */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                🏋️ Personal Trainer Subscription Details
              </h2>

              {personalTrainer ? (
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                  <label className="block text-gray-700 dark:text-gray-300 font-medium">
                    Trainer Name
                  </label>
                  <Input value={personalTrainer.name} disabled className="mb-2" />
                  <label className="block text-gray-700 dark:text-gray-300 font-medium">
                    Sessions
                  </label>
                  <Input
                    value={personalTrainer.session.toString()}
                    disabled
                    className="mb-2"
                  />
                  <label className="block text-gray-700 dark:text-gray-300 font-medium">
                    Price
                  </label>
                  <Input
                    value={`₱${personalTrainer.price}`}
                    disabled
                    className="mb-2"
                  />
                  <label className="block text-gray-700 dark:text-gray-300 font-medium">
                    Features
                  </label>
                  <div className="bg-gray-50 dark:bg-gray-600 p-2 rounded-lg shadow-sm">
                    {personalTrainer.features.split(",").map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <p>{feature.trim()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Loading personal trainer details...
                </p>
              )}
            </div>

            {/* User Information */}
            {user ? (
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-sm mt-4">
                <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                  👤 User Information
                </h2>
                <label className="block text-gray-700 dark:text-gray-300 font-medium">
                  Full Name
                </label>
                <Input value={user.name || "N/A"} disabled className="mb-2" />
                <label className="block text-gray-700 dark:text-gray-300 font-medium">
                  Email
                </label>
                <Input value={user.email || "N/A"} disabled className="mb-2" />
                <label className="block text-gray-700 dark:text-gray-300 font-medium">
                  Contact Number
                </label>
                <Input value={user.contact_number || "N/A"} disabled className="mb-2" />
                <label className="block text-gray-700 dark:text-gray-300 font-medium">
                  Birthday
                </label>
                <Input
                  value={
                    user.birthday && !isNaN(Date.parse(user.birthday))
                      ? format(new Date(user.birthday), "MMMM d, yyyy")
                      : "No Birthday Provided"
                  }
                  disabled
                  className="mb-2"
                />
                <label className="block text-gray-700 dark:text-gray-300 font-medium">
                  Address
                </label>
                <Input value={user.address || "N/A"} disabled className="mb-2" />
                <label className="block text-gray-700 dark:text-gray-300 font-medium">
                  ⚧ Gender
                </label>
                <Input value={user.gender || "N/A"} disabled className="mb-2" />
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">
                Loading user details...
              </p>
            )}
          </div>

          {/* Payment Section */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 w-full lg:w-2/5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              💳 Payment Details
            </h2>
            <Select
              label="Payment Method"
              selectedKeys={selectedPaymentMethod ? [selectedPaymentMethod.name] : []}
              onSelectionChange={handlePaymentMethodChange}
            >
              {paymentMethods.map((method) => (
                <SelectItem key={method.name}>{method.name}</SelectItem>
              ))}
            </Select>

            {/* QR Code */}
            <div className="flex justify-center items-center mt-4 pb-3">
              {selectedPaymentMethod?.qr_code && (
                <Image
                  src={
                    selectedPaymentMethod.qr_code.startsWith("http")
                      ? selectedPaymentMethod.qr_code
                      : `${API_BASE}/storage/${selectedPaymentMethod.qr_code}`
                  }
                  alt="QR Code"
                  width={150}
                  height={150}
                  className="rounded-lg shadow-md"
                  onError={(e) => (e.currentTarget.src = "/default-qr.png")}
                />
              )}
            </div>

            <Form validationBehavior="aria" onSubmit={handleSubmit}>
              <Input
                isRequired
                label="Reference Number"
                name="reference_number"
                placeholder="Enter reference number"
                validate={validateReferenceNumber}
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />

              {/* Upload Proof of Payment */}
              <div className="mt-4">
                <label className="block font-medium text-gray-700 dark:text-gray-300">
                  Upload Proof of Payment
                </label>
                <div className="relative flex flex-col gap-4 mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="block w-full p-2 border border-gray-300 rounded-md"
                  />

                  {uploadedImage && (
                    <div className="flex justify-center mt-4">
                      <img
                        src={uploadedImage}
                        alt="Uploaded Proof"
                        className="max-w-full h-auto rounded-lg shadow-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3">
                <Button color="primary" isLoading={loading} type="submit" className="w-full">
                  Submit Payment
                </Button>
              </div>
            </Form>
          </div>
        </div>
      </div>
    </>
  );
}
