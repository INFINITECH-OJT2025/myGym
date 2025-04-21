"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import Sidebar from "@/components/sidebar_admin";
import {
  Card,
  CardHeader,
  CardBody,
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
  useDraggable,
  Button,
  Pagination,
} from "@heroui/react";
import { Trash } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface Membership {
  id: number;
  start_date: string;
  end_date: string;
  user: { id: number; name: string; image: string | null };
  subscription: { id: number; plan_name: string };
}

export default function ExpiredMemberships() {
  const [expiredMemberships, setExpiredMemberships] = useState<Membership[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const targetRef = useRef(null);
  const { moveProps } = useDraggable({ targetRef, isDisabled: !isOpen });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const totalPages = Math.ceil(expiredMemberships.length / rowsPerPage);

  useEffect(() => {
    fetchExpiredMemberships();
  }, []);

  const fetchExpiredMemberships = async () => {
    try {
      console.log("🚀 Fetching expired memberships...");
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("❌ No token found! User must log in.");
        setError("Unauthorized access. Please log in.");
        return;
      }
      const response = await axios.get<{ data: Membership[] }>(
        `${API_BASE}/api/expired-memberships`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          withCredentials: true,
        }
      );

      console.log("✅ API Response:", response.data);
      setExpiredMemberships(response.data.data || []);
    } catch (err: any) {
      console.error(
        "❌ Error fetching expired memberships:",
        err.response?.data || err.message
      );
      setError("Failed to fetch expired memberships.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this membership?")) return;

    try {
      await axios.delete(`${API_BASE}/api/expired-memberships/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
        withCredentials: true,
      });

      console.log("✅ Membership deleted successfully.");
      setExpiredMemberships((prev) =>
        prev.filter((membership) => membership.id !== id)
      );
    } catch (err) {
      console.error("❌ Error deleting membership:", err);
    }
  };

  const handleViewImage = (imageUrl: string | null) => {
    if (imageUrl) {
      setSelectedImage(`${API_BASE}/profile_pictures/${imageUrl}`);
      onOpen();
    }
  };

  const paginatedMemberships = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return expiredMemberships.slice(start, start + rowsPerPage);
  }, [page, expiredMemberships]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 transition-all duration-300 w-full md:ml-[250px] lg:ml-[280px]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Expired Memberships</h1>
        </div>

        {/* Membership Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mx-auto max-w-[1300px]">
          {loading ? (
            <p className="text-center py-6 text-gray-500">Loading...</p>
          ) : paginatedMemberships.length > 0 ? (
            paginatedMemberships.map((membership) => (
              <Card
                key={membership.id}
                className="shadow-lg p-5 flex flex-col w-full min-h-[300px] relative"
              >
                {/* Image Preview & View Button */}
                <div
                  className="absolute top-2 right-2 flex flex-col items-center gap-1 z-[999]"
                  style={{ pointerEvents: "auto" }}
                >
                  {membership.user?.image ? (
                    <div className="w-[50px] h-[50px] rounded-full overflow-hidden border border-gray-300 bg-white shadow-sm flex items-center justify-center">
                      <Image
                        alt="User Image"
                        className="object-cover w-full h-full"
                        src={`${API_BASE}/profile_pictures/${membership.user.image}`}
                        width={50}
                        height={50}
                      />
                    </div>
                  ) : (
                    <p className="text-gray-500 text-xs">No Image</p>
                  )}

                  {/* View Button */}
                  {membership.user?.image && (
                    <button
                      onClick={() => {
                        setSelectedImage(
                          `${API_BASE}/profile_pictures/${membership.user.image}`
                        );
                        onOpen();
                      }}
                      className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-md shadow hover:bg-blue-600 transition focus:outline-none focus:ring focus:ring-blue-300 pointer-events-auto"
                    >
                      View
                    </button>
                  )}
                </div>

                {/* Membership Info */}
                <CardHeader className="pb-2 pt-2 px-4 flex flex-col items-start">
                  <h4 className="font-bold text-lg">
                    {membership.user?.name || "Unknown User"}
                  </h4>
                  <span className="px-2 py-1 text-sm font-semibold rounded-md bg-red-500 text-white">
                    Expired
                  </span>
                </CardHeader>

                <CardBody className="overflow-visible py-2 flex flex-col">
                  <p className="text-sm text-gray-600 font-semibold">Plan:</p>
                  <p className="text-sm text-gray-500">
                    {membership.subscription?.plan_name || "No Plan"}
                  </p>

                  <p className="text-sm text-gray-600 font-semibold mt-2">
                    Start Date:
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(membership.start_date).toLocaleDateString()}
                  </p>

                  <p className="text-sm text-gray-600 font-semibold mt-2">
                    End Date:
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(membership.end_date).toLocaleDateString()}
                  </p>
                </CardBody>

                {/* Delete Button */}
                <Button
                  onPress={() => handleDelete(membership.id)}
                  variant="ghost"
                  color="danger"
                >
                  <Trash className="w-5 h-5" /> Delete
                </Button>
              </Card>
            ))
          ) : (
            <p className="text-center py-6 text-gray-500">
              No expired memberships found.
            </p>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              loop
              showControls
              color="success"
              initialPage={page}
              total={totalPages}
              onChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Image Modal */}
      <Modal ref={targetRef} isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          <ModalHeader {...moveProps}>Profile Image</ModalHeader>
          <ModalBody>
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Profile Image"
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
