"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/sidebar_member";
import TriggerModal from "@/components/trigger_modal";
import { Calendar } from "@heroui/react";
import {
  Button,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Card,
  CardHeader,
  CardBody,
  Image,
  Checkbox,
  DatePicker,
} from "@heroui/react";
import { Clock, Menu } from "lucide-react";
import { format } from "date-fns";
import { today, getLocalTimeZone } from "@internationalized/date";
import { TimeInput } from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { useDateFormatter } from "@react-aria/i18n";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function MembershipDashboard() {
  // All hooks are declared unconditionally:
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);

  interface Facility {
    id: number;
    name: string;
  }
  interface Equipment {
    id: number;
    name: string;
  }
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  interface Trainer {
    id: number;
    user?: {
      name?: string;
      image?: string;
    };
    specialization?: string;
    availability?: string;
    bio?: string;
  }
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedFacility, setSelectedFacility] = useState<string | null>(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [selectedTrainer, setSelectedTrainer] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<ReturnType<
    typeof parseDate
  > | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [hasTrainer, setHasTrainer] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const formatter = useDateFormatter({ dateStyle: "full" });
  const [showBioId, setShowBioId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;
  const totalPages = Math.ceil(trainers.length / itemsPerPage);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // useEffects and other logic:
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const fetchDataAsync = async () => {
      setLoading(true);
      await fetchData("facilities", setFacilities);
      await fetchData("equipment", setEquipment);
      console.log("Facilities:", facilities);
      console.log("Equipment:", equipment);
      setLoading(false);
    };
    fetchDataAsync();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) setSidebarOpen(true);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/trainers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      const data = response.data as { trainers: Trainer[] };
      setTrainers(data.trainers || []);
    } catch (error) {
      console.error("❌ Error fetching trainers:", error);
      setTrainers([]);
    }
  };

  const paginatedTrainers = trainers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  type FetchDataFunction = <T>(
    endpoint: string,
    setState: React.Dispatch<React.SetStateAction<T>>,
    auth?: boolean
  ) => Promise<void>;

  const fetchData: FetchDataFunction = async (
    endpoint,
    setState,
    auth = false
  ) => {
    try {
      const headers = auth
        ? { Authorization: `Bearer ${localStorage.getItem("token")}` }
        : {};
      const response = await axios.get<any>(`${API_BASE}/api/${endpoint}`, {
        headers,
      });
      setState(response.data || []);
    } catch (error) {
      console.error(`❌ Error fetching ${endpoint}:`, error);
      setState([]);
    }
  };

  const handleReservation = async () => {
    if (!selectedDate || !selectedTime) {
      alert("Please select a date and time.");
      return;
    }
    try {
      await axios.post(
        `${API_BASE}/api/reservations`,
        {
          reservation_date: selectedDate
            .toDate(getLocalTimeZone())
            .toISOString()
            .split("T")[0],
          reservation_time: selectedTime,
          facility_id: selectedFacility || null,
          equipment_id: selectedEquipment || null,
          trainer_id: hasTrainer ? selectedTrainer : null,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Reservation successful!");
      onClose();
    } catch (error) {
      console.error("❌ Error submitting reservation:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to send reservation.";
      alert(errorMessage);
    }
  };

  // Now, conditionally render the UI once mounted is true
  if (!mounted) {
    return null; // or you could return a loader component
  }

  return (
    <div className="flex overflow-x-hidden">
      {sidebarOpen && <Sidebar />}
      <TriggerModal />

      <div
        className={`flex-1 p-5 transition-all duration-300 ${sidebarOpen && !isMobile ? "ml-72" : ""}`}
      >
        <h1 className="text-2xl font-bold">Gym Reservation</h1>
        <p className="mt-2 font-semibold text-blue-600 dark:text-blue-400">
          Gym hours are 6 AM - 12 PM and 1 PM - 5 PM only.
        </p>
        <p className="mt-2 font-semibold text-blue-500 dark:text-blue-300">
          Time management is the first step to success.
        </p>
        <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg shadow-md">
          

          <style jsx>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 8px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background-color: #d1d5db;
              border-radius: 9999px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: transparent;
            }
          `}</style>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div>
              {/* Equipment Dropdown */}
              {equipment?.length > 0 ? (
                <>
                  <label className="block font-medium">Select Equipment</label>
                  <Select
                    aria-label="Select Equipment"
                    className="mt-1"
                    selectedKeys={
                      selectedEquipment ? [String(selectedEquipment)] : []
                    }
                    onSelectionChange={(keys) =>
                      setSelectedEquipment(Array.from(keys)[0])
                    }
                  >
                    {equipment.map((item) => (
                      <SelectItem key={item.id}>{item.name}</SelectItem>
                    ))}
                  </Select>
                </>
              ) : (
                <p className="text-gray-500">No equipment available.</p>
              )}

              {/* Facility Dropdown */}
              {facilities?.length > 0 ? (
                <>
                  <label className="block font-medium mt-4">
                    Select Facility
                  </label>
                  <Select
                    aria-label="Select Facility"
                    className="mt-1"
                    selectedKeys={
                      selectedFacility ? [String(selectedFacility)] : []
                    }
                    onSelectionChange={(keys) =>
                      setSelectedFacility(Array.from(keys)[0])
                    }
                  >
                    {facilities.map((item) => (
                      <SelectItem key={item.id}>{item.name}</SelectItem>
                    ))}
                  </Select>
                </>
              ) : (
                <p className="text-gray-500">No facilities available.</p>
              )}

              {/* Date Picker */}
              <label className="block font-medium mt-4">Select Date</label>
              <DatePicker
                className="max-w-[284px] mt-1"
                value={selectedDate}
                onChange={setSelectedDate}
                minValue={today(getLocalTimeZone())}
              />
              <p className="text-default-500 dark:text-gray-400 text-sm mt-1">
                Selected date:{" "}
                {selectedDate
                  ? formatter.format(selectedDate.toDate(getLocalTimeZone()))
                  : "--"}
              </p>

              {/* Time Input */}
              <label className="block font-medium mt-4">Select Time</label>
              <TimeInput
                onChange={(val) =>
                  setSelectedTime(
                    val
                      ? `${val.hour.toString().padStart(2, "0")}:${val.minute
                          .toString()
                          .padStart(2, "0")}`
                      : null
                  )
                }
              />
            </div>
          </div>

          <Button
            variant="solid"
            color="success"
            className="mt-6"
            onPress={handleReservation}
          >
            Reserve Now
          </Button>

          {previewImage && (
            <Modal
              isOpen={!!previewImage}
              onOpenChange={() => setPreviewImage(null)}
              placement="center"
              className="z-[9999]"
            >
              <ModalContent>
                <ModalHeader className="text-lg font-semibold">
                  Profile Image
                </ModalHeader>
                <ModalBody>
                  <img
                    src={previewImage}
                    alt="Enlarged Trainer Image"
                    className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                  />
                </ModalBody>
                <ModalFooter>
                  <Button
                    variant="flat"
                    color="danger"
                    onPress={() => setPreviewImage(null)}
                  >
                    Close
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </div>
      </div>
    </div>
  );
}
