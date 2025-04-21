"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import Sidebar from "@/components/sidebar_admin";
import {
  Card,
  CardHeader,
  CardBody,
  Image,
  Pagination,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  useDraggable,
  Button,
  addToast,
} from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface Payment {
  id: number;
  user: {
    name: string;
  };
  subscription: {
    plan_name: string;
  };
  payment_method: {
    name: string;
  };
  amount: string;
  reference_number: string;
  image: string | null;
  transaction_date: string;
  status: "pending" | "completed" | "failed";
  membership?: {
    start_date: string;
  };
}

export default function PaymentTable() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 3;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const targetRef = useRef(null);
  const { moveProps } = useDraggable({ targetRef, isDisabled: !isOpen });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      console.log("🚀 Fetching payments...");
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("❌ No token found! User must log in.");
        return;
      }

      const response = await axios.get(`${API_BASE}/api/payments`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        withCredentials: true,
      });

      console.log("✅ API Response:", JSON.stringify(response.data, null, 2)); // ✅ Debugging API response

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid API response format");
      }

      setPayments(response.data);
    } catch (err: any) {
      console.error("❌ Error fetching payments:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (paymentId: number, newStatus: string) => {
    try {
      const response = await axios.put(
        `${API_BASE}/api/payments/${paymentId}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json",
          },
        }
      );

      console.log(
        `✅ Payment ID ${paymentId} status updated to ${newStatus}`,
        response.data
      );

      // ✅ Get the user associated with this payment
      const updatedPayment = payments.find((p) => p.id === paymentId);
      const user = updatedPayment?.user; // Ensure user exists before using it

      if (newStatus === "completed" && user) {
        addToast({
          title: "Successful Payment",
          description: `The payment of ${user.name} has been authenticated!`,
          color: "success",
          variant: "flat",
          radius: "full",
          timeout: 4000,
          hideIcon: true,
          classNames: {
            closeButton: "show",
          },
        });

        // ✅ Remove completed payments immediately from state
        setPayments((prev) =>
          prev.filter((payment) => payment.id !== paymentId)
        );

        // ✅ Fetch updated payments list to ensure sync with backend
        fetchPayments();
      }
    } catch (err) {
      console.error(
        `❌ Error updating status for Payment ID ${paymentId}:`,
        err
      );
    }
  };

  const totalPages = Math.ceil(payments.length / rowsPerPage);

  const paginatedPayments = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return payments.slice(start, start + rowsPerPage);
  }, [page, payments]);

  return (
    <div className="flex overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content - Responsive Fix */}
      <div className="flex-1 p-6 transition-all duration-300 w-full md:ml-[250px] lg:ml-[280px]">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Subscription Payments</h1>
        </div>

        {/* Payments Cards Grid - Optimized for Space */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mx-auto max-w-[1300px]">
          {loading ? (
            <p>Loading payments...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : paginatedPayments.length > 0 ? (
            paginatedPayments.map((payment) => (
              <Card
                key={payment.id}
                className="shadow-lg p-6 flex flex-col w-full min-h-[520px] relative"
              >
                {/* Name, Plan Name */}
                <CardHeader className="pb-3 pt-3 px-4 flex flex-col items-start">
                  <h4 className="font-bold text-lg">{payment.user.name}</h4>
                  <p className="text-md text-gray-500">
                    {payment.subscription.plan_name}
                  </p>

                  {/* Payment Method, Price */}
                  <div className="flex items-center justify-between w-full mt-3">
                    <p className="text-sm font-semibold uppercase text-gray-500">
                      {payment.payment_method.name}
                    </p>
                    <p className="text-green-500 font-bold text-lg">
                      ₱{Number(payment.amount).toLocaleString()}
                    </p>
                  </div>
                </CardHeader>

                {/* Card Body */}
                <CardBody className="overflow-visible py-1 flex flex-col flex-grow items-center">
                  {/* Reference Number - Placed at the top */}
                  <p className="text-sm text-gray-600 font-semibold mb-1">
                    Reference Number
                  </p>
                  <p className="px-3 py-1 bg-blue-100 text-blue-600 font-semibold rounded-md text-sm">
                    {payment.reference_number}
                  </p>

                  {/* Image Preview - Moved up */}
                  {payment.image ? (
                    <button
                      onClick={() => {
                        setSelectedImage(
                          `${API_BASE}/storage/${payment.image}`
                        );
                        onOpen();
                      }}
                      className="mt-3 w-full"
                    >
                      <Image
                        alt="Proof of Payment"
                        className="object-cover rounded-xl w-full max-w-[250px] hover:opacity-75 transition"
                        src={`${API_BASE}/storage/${payment.image}`}
                        width={250}
                        height={140}
                      />
                    </button>
                  ) : (
                    <p className="text-gray-500 mt-2">No Image</p>
                  )}

                  {/* Dates Section - Left Aligned */}
                  <div className="flex flex-col w-full text-left mt-4 px-4">
                    {/* ✅ Transaction Date - Always Today (Green) */}
                    <p className="text-sm font-semibold text-green-600">
                      Transaction Date:
                      <span className="block text-green-600">
                        {new Date(payment.transaction_date).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          }
                        )}
                      </span>
                    </p>

                    {/* ✅ Start Date - Chosen Date (Blue) */}
                    <p className="text-sm font-semibold text-blue-600 mt-1">
                      Start Date:
                      <span className="block text-blue-600">
                        {payment.membership?.start_date
                          ? new Date(
                              payment.membership.start_date
                            ).toLocaleDateString("en-US", {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "No Start Date"}
                      </span>
                    </p>
                  </div>
                </CardBody>

                {/* Status Dropdown */}
                <div className="absolute bottom-6 left-0 w-full px-6">
                  <Select
                    selectedKeys={[payment.status]}
                    onSelectionChange={(keys) =>
                      handleStatusChange(payment.id, Array.from(keys)[0] as string)
                    }
                    className="w-full"
                  >
                    <SelectItem
                      key="pending"
                      className="text-orange-500 font-bold text-sm"
                    >
                      🟠 Pending
                    </SelectItem>
                    <SelectItem
                      key="completed"
                      className="text-green-500 font-bold text-sm"
                    >
                      🟢 Completed
                    </SelectItem>
                    <SelectItem
                      key="failed"
                      className="text-red-500 font-bold text-sm"
                    >
                      🔴 Failed
                    </SelectItem>
                  </Select>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-center py-6 text-gray-500">No payments found.</p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination
              total={totalPages}
              page={page}
              onChange={setPage}
              showControls
            />
          </div>
        )}
      </div>

      {/* Draggable Image Modal */}
      <Modal
        ref={targetRef}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        classNames={{
          backdrop: "bg-black/15",
        }}
      >
        <ModalContent>
          <ModalHeader {...moveProps}>Proof of Payment</ModalHeader>
          <ModalBody>
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Payment Proof"
                width={600}
                height={600}
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}