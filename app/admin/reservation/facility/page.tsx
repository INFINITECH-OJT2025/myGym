"use client";

import React, { useEffect, useState } from "react";
import axios, { isAxiosError } from "axios";
import { Card, CardBody, CardFooter, Button, Pagination } from "@heroui/react";
import Sidebar from "@/components/sidebar_admin";
import { parseDate, getLocalTimeZone } from "@internationalized/date";
import { DateFormatter } from "@react-aria/i18n";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

const ReservationsPage = () => {
  interface Reservation {
    id: number;
    reservation_date: string;
    reservation_time: string;
    facility?: { name: string };
    equipment?: { name: string };
    status: string;
  }

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchReservations(token);
    } else {
      alert("No auth token found. Please log in again.");
    }
  }, []);

  interface FetchReservationsResponse {
    id: number;
    reservation_date: string;
    reservation_time: string;
    facility?: { name: string };
    equipment?: { name: string };
    status: string;
  }

  const fetchReservations = async (token: string): Promise<void> => {
    try {
      const { data } = await axios.get<FetchReservationsResponse[]>(`${API_BASE}/api/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Fetched Reservations:", data);
      setReservations(data);
    } catch (error) {
      console.error(
        "Error fetching reservations:",
        isAxiosError(error) ? error.response?.data : error
      );
    }
  };

  interface ArchiveResponse {
    success: boolean;
    message: string;
  }

  const handleArchive = async (id: number): Promise<void> => {
    if (!confirm("Are you sure you want to archive this reservation?")) return;

    try {
      await axios.delete<ArchiveResponse>(`${API_BASE}/api/reservations/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      fetchReservations(localStorage.getItem("token") as string);
    } catch (error) {
      alert("Error archiving reservation.");
    }
  };

  const paginatedReservations = reservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ✅ Properly format reservation date to a word format
  const formatDate = (dateString: string) => {
    try {
      const localTimeZone = getLocalTimeZone();
      const date = parseDate(dateString);
      const formatter = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });

      return formatter.format(new Date(dateString));
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original if formatting fails
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <Sidebar />
      <h2 className="text-2xl font-semibold mb-4">Reservation for Facility and Equipment</h2>

      {paginatedReservations.length > 0 ? (
        paginatedReservations.map((res) => (
          <Card key={res.id} className="mb-4">
            <CardBody>
              <p>
                <strong>Date:</strong> {formatDate(res.reservation_date)}
              </p>
              <p>
                <strong>Time:</strong> {res.reservation_time}
              </p>
              <p>
                <strong>Facility:</strong> {res.facility?.name || "N/A"}
              </p>
              <p>
                <strong>Equipment:</strong> {res.equipment?.name || "N/A"}
              </p>
              <p>
                <strong>Status:</strong> {res.status}
              </p>
            </CardBody>
            <CardFooter className="flex justify-end">
              <Button
                color="danger"
                variant="solid"
                size="sm"
                onPress={() => handleArchive(res.id)}
              >
                Archive
              </Button>
            </CardFooter>
          </Card>
        ))
      ) : (
        <p>No reservations found.</p>
      )}

      <Pagination
        page={currentPage}
        total={Math.ceil(reservations.length / itemsPerPage)}
        onChange={setCurrentPage}
        className="mt-4"
      />
    </div>
  );
};

export default ReservationsPage;
