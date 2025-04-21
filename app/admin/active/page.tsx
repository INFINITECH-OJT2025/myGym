"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface Membership {
  id: number;
  user: {
    id: number;
    name: string;
    image: string | null;
  };
  subscription: {
    id: number;
    plan_name: string;
  };
  start_date: string;
  end_date: string;
  status: string;
}

export default function ActiveMemberships() {
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;
  const totalPages = Math.ceil(memberships.length / rowsPerPage);

  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const targetRef = useRef(null);
  const { moveProps } = useDraggable({ targetRef, isDisabled: !isOpen });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    fetchActiveMemberships();
  }, []);

  const fetchActiveMemberships = async () => {
    try {
      console.log("🚀 Fetching active memberships...");
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("❌ No token found! User must log in.");
        return;
      }

      const response = await axios.get(`${API_BASE}/api/memberships/active`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        withCredentials: true,
      });

      console.log("✅ API Response:", JSON.stringify(response.data, null, 2));

      if (!response.data || !Array.isArray(response.data)) {
        throw new Error("Invalid API response format");
      }

      setMemberships(response.data);
    } catch (err: any) {
      console.error("❌ Error fetching memberships:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fix Pagination
  const paginatedMemberships = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return memberships.slice(start, start + rowsPerPage);
  }, [page, memberships]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 transition-all duration-300 w-full md:ml-[250px] lg:ml-[280px]">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Active Memberships</h1>
        </div>

        {/* Membership Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mx-auto max-w-[1300px]">
          {paginatedMemberships.length > 0 ? (
            paginatedMemberships.map((membership) => (
              <Card
                key={membership.id}
                className="shadow-lg p-5 flex flex-col w-full min-h-[300px] relative"
              >
                {/* Image Preview Button */}
                <div className="absolute top-2 right-2 z-50 flex flex-col items-center space-y-1">
                  {membership.user?.image ? (
                    <>
                      {/* Image */}
                      <div className="w-[50px] h-[50px] rounded-full overflow-hidden border border-gray-300 bg-white shadow-md flex items-center justify-center">
                        <Image
                          alt="User Image"
                          className="object-cover w-full h-full"
                          src={`${API_BASE}/profile_pictures/${membership.user.image}`}
                        />
                      </div>

                      {/* View Button */}
                      <button
                        onClick={() => {
                          setSelectedImage(
                            `${API_BASE}/profile_pictures/${membership.user.image}`
                          );
                          onOpen();
                        }}
                        className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-md shadow hover:bg-blue-600 transition focus:outline-none focus:ring focus:ring-blue-300"
                      >
                        View
                      </button>
                    </>
                  ) : (
                    <p className="text-gray-500 text-xs">No Image</p>
                  )}
                </div>

                {/* Membership Info */}
                <CardHeader className="pb-2 pt-2 px-4 flex flex-col items-start">
                  <h4 className="font-bold text-lg">
                    {membership.user?.name || "Unknown User"}
                  </h4>
                  <span className="px-2 py-1 text-sm font-semibold rounded-md bg-green-500 text-white">
                    Active
                  </span>
                </CardHeader>

                <CardBody className="overflow-visible py-2 flex flex-col">
                  {/* Subscription Plan */}
                  <p className="text-sm text-gray-600 font-semibold">Plan:</p>
                  <p className="text-sm text-gray-500">
                    {membership.subscription?.plan_name || "No Plan"}
                  </p>

                  {/* Start Date */}
                  <p className="text-sm text-gray-600 font-semibold mt-2">
                    Start Date:
                  </p>
                  <p className="text-sm text-gray-500">
                    {membership.start_date
                      ? new Date(membership.start_date).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      : "No Start Date"}
                  </p>

                  {/* End Date */}
                  <p className="text-sm text-gray-600 font-semibold mt-2">
                    End Date:
                  </p>
                  <p className="text-sm text-gray-500">
                    {membership.end_date
                      ? new Date(membership.end_date).toLocaleDateString(
                          "en-US",
                          {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          }
                        )
                      : "No End Date"}
                  </p>
                </CardBody>
              </Card>
            ))
          ) : (
            <p className="text-center py-6 text-gray-500">
              No active memberships found.
            </p>
          )}
        </div>

        {/* ✅ Pagination Component */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              loop
              showControls
              color="success"
              initialPage={page}
              total={totalPages}
              onChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </div>

      <Modal
        ref={targetRef}
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="xl" // Makes the modal wider
        className="max-w-[500px] w-full" // Custom width
      >
        <ModalContent className="max-w-[600px] w-full max-h-[400px]">
          <ModalHeader
            {...moveProps}
            className="text-center text-lg font-semibold"
          >
            Profile Image
          </ModalHeader>
          <ModalBody className="flex justify-center items-center">
            {selectedImage && (
              <Image
                src={selectedImage}
                alt="Profile Image"
                width={500} // Adjusted width
                height={300} // Adjusted height
                className="rounded-lg shadow-lg"
              />
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
