"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import type { AxiosError } from "axios";

function isAxiosError(error: unknown): error is AxiosError {
  return (error as AxiosError).isAxiosError !== undefined;
}
import Sidebar from "@/components/sidebar_admin";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  Tooltip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDraggable,
} from "@heroui/react";
import { Button } from "@heroui/button";
import { Pencil, Trash } from "lucide-react";
import AddPaymentMethod from "@/components/add_payment_method";
import EditPaymentMethod from "@/components/edit_payment_method";
import { addToast } from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface PaymentMethod {
  id: number;
  name: string;
  account_number: string;
  qr_code: string | null;
  status: "active" | "inactive";
}

export default function PaymentMethodTable() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<
    number | null
  >(null);
  const [isMobile, setIsMobile] = useState(false);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const qrPreviewRef = useRef(null);
  const { moveProps } = useDraggable({
    targetRef: qrPreviewRef,
    isDisabled: !qrPreviewUrl,
  });

  const [page, setPage] = useState(1);
  const rowsPerPage = 5;
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchPaymentMethods();

    // ✅ Detect screen size
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      console.log("🚀 Fetching payment methods...");
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("❌ No token found! User must log in.");
        setError("You must be logged in to view payment methods.");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${API_BASE}/api/payment-methods`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        withCredentials: true,
      });

      console.log("✅ API Response:", response.data);
      setPaymentMethods((response.data as PaymentMethod[]) ?? []);
    } catch (err) {
      console.error(
        "❌ Error fetching payment methods:",
        isAxiosError(err) ? err.response?.data || err.message : String(err)
      );
      setError("Failed to fetch payment methods.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (paymentMethodId: number) => {
    console.log(`🔍 Opening edit modal for ID: ${paymentMethodId}`);
    setSelectedPaymentMethodId(paymentMethodId);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedPaymentMethodId(null);
    setEditModalOpen(false);
  };

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    const token = localStorage.getItem("token");

    addToast({
      title: "Deleted Successfully",
      description: `Payment method ${paymentMethods.name} has been deleted.`,
      color: "success",
      variant: "flat",
      radius: "full",
      timeout: 2000,
      hideIcon: true,
      classNames: {
        closeButton: "show",
      },
    });

    if (!token) {
      console.error("❌ No token found! User must log in.");
      setError("Authentication required.");
      return;
    }
    try {
      await axios.delete(`${API_BASE}/api/payment-methods/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      console.log("✅ Payment method deleted successfully.");
      setPaymentMethods((prev) => prev.filter((method) => method.id !== id));
    } catch (err) {
      console.error(
        "❌ Error deleting payment method:",
        isAxiosError(err) ? err.response?.data || err.message : String(err)
      );
      setError("Failed to delete payment method. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const pages = Math.ceil(paymentMethods.length / rowsPerPage);
  const paginatedMethods = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return paymentMethods.slice(start, start + rowsPerPage);
  }, [page, paymentMethods]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Hidden on small screens, shown on larger screens */}
      <Sidebar />
      <div className="hidden md:block"></div>

      {/* ✅ Adjust layout for mobile & desktop */}
      <div className="flex-1 p-4 md:p-6 transition-all duration-300 w-full md:ml-60">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
          <h1 className="text-xl md:text-2xl font-bold">
            Payment Methods Management
          </h1>
          <Button
            variant="solid"
            color="primary"
            onPress={() => setModalOpen(true)}
          >
            Add Payment Method
          </Button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <p className="p-4 text-center text-gray-500">
              Loading payment methods...
            </p>
          ) : error ? (
            <p className="p-4 text-center text-red-500">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table aria-label="Payment Methods Table" className="min-w-full">
                <TableHeader>
                  <TableColumn className="w-40">NAME</TableColumn>
                  <TableColumn className="w-40">ACCOUNT NUMBER</TableColumn>
                  <TableColumn className="w-20">STATUS</TableColumn>
                  <TableColumn className="w-40">QR CODE</TableColumn>
                  <TableColumn className="w-40">ACTIONS</TableColumn>
                </TableHeader>
                <TableBody>
                  {paginatedMethods.length > 0 ? (
                    paginatedMethods.map((method) => (
                      <TableRow key={method.id} className="h-16">
                        <TableCell>{method.name}</TableCell>
                        <TableCell>{method.account_number}</TableCell>
                        <TableCell>
                          <span
                            className={`font-semibold ${
                              method.status === "active"
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {method.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {method.qr_code ? (
                            <Tooltip content="Click to view">
                              <img
                                src={method.qr_code || "/default-qrcode.png"}
                                alt="QR Code"
                                className="w-16 h-16 rounded-lg shadow-md object-cover cursor-pointer"
                                onClick={() => setQrPreviewUrl(method.qr_code)}
                              />
                            </Tooltip>
                          ) : (
                            "No QR Code"
                          )}
                        </TableCell>  
                        <TableCell className="flex gap-2 sm:gap-3 flex-wrap">
                          <Button
                            variant="ghost"
                            color="primary"
                            onPress={() => openEditModal(method.id)}
                          >
                            <Pencil className="w-5 h-5" /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            color="danger"
                            onPress={() => {
                              setUserToDelete(method.id); // store selected user
                              setShowDeleteModal(true); // open modal
                            }}
                          >
                            <Trash className="w-5 h-5" /> Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center py-4 text-gray-500"
                      >
                        No payment methods available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* ✅ Responsive Pagination */}
        {pages > 1 && (
          <div className="flex justify-center mt-4">
            <Pagination total={pages} initialPage={page} onChange={setPage} />
          </div>
        )}
      </div>

      {/* ✅ Modals */}
      <AddPaymentMethod
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onMethodAdded={fetchPaymentMethods}
      />
      <EditPaymentMethod
        isOpen={editModalOpen}
        paymentMethodId={selectedPaymentMethodId}
        onClose={closeEditModal}
        onMethodUpdated={fetchPaymentMethods}
      />

      {/* ✅ QR Preview Modal */}
      {qrPreviewUrl && (
        <Modal
          ref={qrPreviewRef}
          isOpen={!!qrPreviewUrl}
          onOpenChange={() => setQrPreviewUrl(null)}
          backdrop="opaque"
          placement="center"
        >
          <ModalContent>
            {(onClose) => (
              <>
                <ModalHeader
                  {...moveProps}
                  className="cursor-move flex justify-between items-center"
                >
                  QR Code Preview
                </ModalHeader>
                <ModalBody>
                  <img
                    src={qrPreviewUrl}
                    alt="QR Code"
                    className="w-full h-auto object-contain rounded-lg"
                  />
                </ModalBody>
                <ModalFooter>
                  <Button color="danger" variant="flat" onPress={onClose}>
                    Close
                  </Button>
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
      <Modal  isOpen={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            <p className="whitespace-normal">
              Are you sure you want to delete{" "}
              <strong className="text-blue-500 font-semibold">
                {paymentMethods.find((method) => method.id === userToDelete)
                  ?.name || "this payment method"}
              </strong>
              ?
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={() => {
                if (userToDelete !== null) {
                  handleDelete(userToDelete);
                  setShowDeleteModal(false);
                }
              }}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
