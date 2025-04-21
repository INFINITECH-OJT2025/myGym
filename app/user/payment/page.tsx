"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Form,
  Input,
  Button,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  DatePicker,
} from "@heroui/react";
import axios from "axios";
import Image from "next/image";
import { format } from "date-fns";
import TriggerModal from "@/components/trigger_modal";
import { addToast } from "@heroui/react";
import { today, getLocalTimeZone } from "@internationalized/date";

const API_BASE = "http://127.0.0.1:8000";

export default function Payment() {
  const searchParams = useSearchParams();
  const subscriptionId = searchParams.get("plan");

  const [isClient, setIsClient] = useState(false); // ✅ Prevent SSR issues
  interface Subscription {
    id: number;
    plan_name: string;
    price: number;
    duration: string;
  }

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<string>("");
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  interface PaymentMethod {
    name: string;
    qr_code?: string;
  }

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const { isOpen, onOpen } = useDisclosure();

  // ✅ Ensures this runs only on the client side
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

        const [userRes, paymentMethodsRes, subscriptionRes] = await Promise.all(
          [
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
            subscriptionId
              ? axios.get(`${API_BASE}/api/subscriptions/${subscriptionId}`)
              : Promise.resolve({ data: null }),
          ]
        );

        setUser(userRes.data);
        setPaymentMethods(paymentMethodsRes.data);
        setSubscription(subscriptionRes.data);
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      }
    };

    fetchData();
  }, [subscriptionId]);

  /** ✅ Compute End Date */
  useEffect(() => {
    if (!subscription || !startDate) return;
    let calculatedEndDate = new Date(startDate);
    switch (subscription.duration) {
      case "daily":
        calculatedEndDate.setDate(startDate.getDate() + 1);
        break;
      case "weekly":
        calculatedEndDate.setDate(startDate.getDate() + 7);
        break;
      case "monthly":
        calculatedEndDate.setMonth(startDate.getMonth() + 1);
        break;
      case "yearly":
        calculatedEndDate.setFullYear(startDate.getFullYear() + 1);
        break;
      case "lifetime":
        setEndDate("Lifetime Access");
        return;
    }
    setEndDate(format(calculatedEndDate, "MMMM d, yyyy"));
  }, [subscription, startDate]);

  /** ✅ Handle Payment Method Change */
  const handlePaymentMethodChange = (keys: any) => {
    const selectedKey = Array.from(keys)[0] as string;
    const selectedMethod = paymentMethods.find(
      (method) => method.name === selectedKey
    );
    setSelectedPaymentMethod(selectedMethod);
  };

  /** ✅ Validate Reference Number */
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

  /** ✅ Handle File Upload */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files ? e.target.files[0] : null;

    if (file) {
      // Check if the file is an image
      if (!file.type.startsWith("image/")) {
        addToast({
          title: "Error",
          description: "Please upload a valid image file.",
          color: "danger",
          variant: "flat",
          radius: "full",
          timeout: 2000,
          hideIcon: true,
          classNames: {
            closeButton: "show",
          },
        });
        return; // Prevent the image from being set if not valid
      }
      // Set the valid image file
      setSelectedFile(file);
      // Optional: Set preview image (if needed)
      setUploadedImage(URL.createObjectURL(file));
    }
  };

  /** ✅ Cleanup Memory Leak for Image URL */
  useEffect(() => {
    return () => {
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage);
      }
    };
  }, [uploadedImage]);

  /** ✅ Handle Payment Submission */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate the reference number if it exists
    const validationError = validateReferenceNumber(referenceNumber);
    if (validationError) {
      setError(validationError);
      return;
    }

    // Check for missing inputs
    if (!startDate) {
      addToast({
        title: "Error",
        description: "Please select a start date.",
        color: "danger",
        variant: "flat",
        radius: "full",
        timeout: 2000,
        hideIcon: true,
        classNames: {
          closeButton: "show",
        },
      });
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
        classNames: {
          closeButton: "show",
        },
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
        classNames: {
          closeButton: "show",
        },
      });
      return;
    }

    // Validate file input (image validation)
    const file = selectedFile;
    if (!file) {
      addToast({
        title: "Error",
        description: "Please upload proof of payment.",
        color: "danger",
        variant: "flat",
        radius: "full",
        timeout: 2000,
        hideIcon: true,
        classNames: {
          closeButton: "show",
        },
      });
      return;
    }

    // Proceed with the payment submission if all required fields are valid
    try {
      setLoading(true);
      setError("");

      const refCheckRes = await axios.get(
        `${API_BASE}/api/payments/check-ref/${referenceNumber}`
      );
      if (refCheckRes.data.exists) {
        addToast({
          title: "Duplicate Reference",
          description:
            "This reference number already exists. Please use a unique one.",
          color: "danger",
          variant: "flat",
          radius: "full",
          timeout: 3000,
          hideIcon: true,
          classNames: {
            closeButton: "show",
          },
        });
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("user_id", user.id);
      formData.append("subscriptions_id", subscription.id);
      formData.append("amount", subscription.price.toString());
      formData.append("payment_method", selectedPaymentMethod.name);
      formData.append("reference_number", referenceNumber);
      if (startDate)
        formData.append("start_date", format(startDate, "yyyy-MM-dd"));
      if (uploadedImage) formData.append("image", selectedFile);

      // Send the payment data to the backend
      await axios.post(`${API_BASE}/api/payments`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Success - open the modal or show a success toast
      addToast({
        title: "Payment Successful",
        description:
          "Your payment was successful. Thank you for your purchase!",
        color: "success",
        variant: "flat",
        radius: "full",
        timeout: 2000,
        hideIcon: true,
        classNames: {
          closeButton: "show",
        },
      });

      onOpen();
    } catch (error) {
      // Error during payment
      setError("❌ Payment failed. Please try again.");
      addToast({
        title: "Error",
        description: "Payment failed. Please try again.",
        color: "danger",
        variant: "flat",
        radius: "full",
        timeout: 2000,
        hideIcon: true,
        classNames: {
          closeButton: "show",
        },
      });
    } finally {
      setLoading(false);
    }
  };

  /** ✅ Prevent Hydration Mismatch by Checking Client State */
  if (!isClient) return null;

  function computeEndDate(newDate: Date) {
    if (!subscription) return;
    let calculatedEndDate = new Date(newDate);
    switch (subscription.duration) {
      case "daily":
        calculatedEndDate.setDate(newDate.getDate() + 1);
        break;
      case "weekly":
        calculatedEndDate.setDate(newDate.getDate() + 7);
        break;
      case "monthly":
        calculatedEndDate.setMonth(newDate.getMonth() + 1);
        break;
      case "yearly":
        calculatedEndDate.setFullYear(newDate.getFullYear() + 1);
        break;
      case "lifetime":
        setEndDate("Lifetime Access");
        return;
    }
    setEndDate(format(calculatedEndDate, "MMMM d, yyyy"));
  }

  function setStartDateFormatted(formattedStartDate: string) {
    console.log("Formatted Start Date:", formattedStartDate);
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 p-6 bg-gray-100 dark:bg-gray-900 min-h-screen relative">
        <TriggerModal />

        {/* ✅ Content Wrapper (For Responsive Layout) */}
        <div className="flex flex-col lg:flex-row gap-4 lg:col-span-5">
          {/* ✅ Main Section */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 w-full lg:w-3/5">
            <h1 className="text-3xl font-bold text-primary text-center text-gray-900 dark:text-gray-100">
              Welcome to Fit & Gym!
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-center italic mb-4">
              "Every journey begins with a single step. Take yours today and
              embrace a healthier lifestyle!"
            </p>

            {/* ✅ Subscription Details */}
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                📜 Subscription Details
              </h2>

              {subscription ? (
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg shadow-sm">
                  <label className="block text-gray-700 dark:text-gray-300 font-medium">
                    Plan Name
                  </label>
                  <Input
                    value={subscription.plan_name}
                    disabled
                    className="mb-2"
                  />
                  <label className="block text-gray-700 dark:text-gray-300 font-medium">
                    Price
                  </label>
                  <Input
                    value={`₱${subscription.price}`}
                    disabled
                    className="mb-2"
                  />
                  <label className="block text-gray-700 dark:text-gray-300 font-medium">
                    Duration
                  </label>
                  <Input
                    value={subscription.duration}
                    disabled
                    className="mb-2"
                  />
                  <label className="block text-gray-700 dark:text-gray-300 font-medium">
                    Choose a preferred date to start your subscription.
                  </label>
                  {isClient && (
                    <DatePicker
                      isRequired
                      className="max-w-[284px]"
                      selected={startDate}
                      onChange={(date) => {
                        const newDate = new Date(date);
                        setStartDate(newDate);
                        // Format the start date as words (e.g., March 12, 2025)
                        const formattedStartDate = format(
                          newDate,
                          "MMMM dd, yyyy"
                        );
                        setStartDateFormatted(formattedStartDate); // Set the formatted date to state
                      }}
                      minValue={today(getLocalTimeZone())}
                      placeholder="Select Start Date"
                      label="Start Date"
                      dateFormat="MMMM dd, yyyy"
                    />
                  )}
                  <label className="block text-gray-700 dark:text-gray-300 font-medium">
                    Start Date
                  </label>
                  <Input
                    value={startDate ? format(startDate, "MMMM d, yyyy") : ""}
                    disabled
                    className="mb-2"
                  />
                  <label className="block text-gray-700 dark:text-gray-300 font-medium mt-4">
                    End Date
                  </label>
                  <Input value={endDate} disabled className="mb-2" />
                </div>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">
                  Loading subscription details...
                </p>
              )}
            </div>

            {/* ✅ User Information */}
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
                <Input
                  value={user.contact_number || "N/A"}
                  disabled
                  className="mb-2"
                />
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
                <Input
                  value={user.address || "N/A"}
                  disabled
                  className="mb-2"
                />
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

          {/* ✅ Payment Section - Moves Below in Mobile */}
          <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6 w-full lg:w-2/5">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              💳 Payment Details
            </h2>
            <Select
              label="Payment Method"
              selectedKeys={
                selectedPaymentMethod ? [selectedPaymentMethod.name] : []
              }
              onSelectionChange={handlePaymentMethodChange}
            >
              {paymentMethods.map((method) => (
                <SelectItem key={method.name}>{method.name}</SelectItem>
              ))}
            </Select>

            {/* ✅ QR Code */}
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

              {/* ✅ Upload Image for Proof */}
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
                        className="max-w-full h-auto rounded-lg shadow-md" // Ensures the image scales properly without distortion
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3">
                <Button
                  color="primary"
                  isLoading={loading}
                  type="submit"
                  className="w-full"
                >
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
