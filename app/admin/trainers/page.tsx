"use client";

import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Sidebar from "@/components/sidebar_admin";
import {
  Card,
  CardHeader,
  CardBody,
  Image,
  Button,
  Pagination,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  useDisclosure,
} from "@heroui/react";
import { Pencil, Trash } from "lucide-react";
import Add from "@/components/add_trainer";
import Edit from "@/components/edit_trainer";
import { format, parseISO } from "date-fns";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

export default function TrainerManagement() {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState<number | null>(
    null
  );
  const [selectedTrainerImage, setSelectedTrainerImage] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;
  const [isMobile, setIsMobile] = useState(false);

  const [personalInfo, setPersonalInfo] = useState<TrainerPersonalInfo | null>(
    null
  );
  const [bioInfo, setBioInfo] = useState("");

  const {
    isOpen: isImageOpen,
    onOpen: openImageModal,
    onClose: closeImageModal,
  } = useDisclosure();
  const {
    isOpen: isPersonalInfoOpen,
    onOpen: openPersonalInfo,
    onClose: closePersonalInfo,
  } = useDisclosure();
  const {
    isOpen: isBioOpen,
    onOpen: openBio,
    onClose: closeBio,
  } = useDisclosure();

  useEffect(() => {
    fetchTrainers();

    // ✅ Detect screen size and update isMobile
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchTrainers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Session expired. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await axios.get<{ trainers: any[] }>(
        `${API_BASE}/api/trainers`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      setTrainers(response.data.trainers ?? []);
    } catch (err) {
      setError("Failed to fetch trainers.");
      console.error(
        "Error fetching trainers:",
        (err as any).response?.data || (err as any).message
      );
    } finally {
      setLoading(false);
    }
  };

  // Pagination Logic
  const paginatedTrainers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return trainers.slice(start, start + itemsPerPage);
  }, [trainers, currentPage]);

  interface Trainer {
    id: number;
    user: {
      profile_image: string | null;
      name: string | null;
      contact_number: string | null;
      address: string | null;
      birthday: string | null;
      gender: string | null;
    };
    specialization: string | null;
    availability_schedule: string | null;
    bio: string | null;
  }

  const openEditModal = (trainer: Trainer): void => {
    setSelectedTrainerId(trainer.id);
    setEditModalOpen(true);
  };

  interface TrainerPersonalInfo {
    user: {
      contact_number: string | null;
      address: string | null;
      birthday: string | null;
      gender: string | null;
    };
  }

  const openPersonalInfoModal = (trainer: TrainerPersonalInfo): void => {
    setPersonalInfo(trainer); // ✅ Store Trainer Data
    openPersonalInfo();
  };

  interface TrainerBioInfo {
    bio: string | null;
  }

  const openBioModal = (trainer: TrainerBioInfo): void => {
    setBioInfo(trainer.bio || "No Bio Available"); // ✅ Store Bio Data
    openBio();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <Sidebar />

      {/* ✅ Main Content (Fixed Responsiveness) */}
      <div
        className={`flex-1 p-4 md:p-6 transition-all duration-300 ${isMobile ? "ml-0" : "ml-64"}`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Trainer Management</h1>
          <Button
            variant="solid"
            color="primary"
            onPress={() => setModalOpen(true)}
          >
            Add Trainer
          </Button>
        </div>

        {/* ✅ Cards Grid Layout */}
        {loading ? (
          <p>Loading trainers...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {paginatedTrainers.map((trainer) => (
                <Card key={trainer.id} className="p-4 shadow-lg rounded-lg">
                  <CardHeader className="flex flex-col items-center">
                    {trainer.user?.image ? (
                      <div className="w-[50px] h-[50px] rounded-full overflow-hidden border border-gray-300 bg-white shadow-sm flex items-center justify-center relative">
                        {trainer.user?.image ? (
                          <Image
                            alt="Profile Image"
                            className="object-cover w-full h-full"
                            src={`${API_BASE}/profile_pictures/${trainer.user.image}`}
                          />
                        ) : (
                          <span className="text-gray-500 text-xs">
                            No Image
                          </span>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs">No Image</p>
                    )}
                    <h2 className="text-xl font-semibold mt-3">
                      {trainer.user?.name || "No Name"}
                    </h2>
                    <p className="text-sm text-gray-500">
                      {trainer.specialization || "No Specialization"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {trainer.availability_schedule
                        ? format(
                            parseISO(trainer.availability_schedule),
                            "hh:mm a"
                          )
                        : "No Availability"}
                    </p>
                  </CardHeader>

                  <CardBody className="text-center">
                    {/* ✅ Buttons for Personal Info & Bio */}
                    <div className="flex justify-center gap-3 mb-3">
                      <Button
                        variant="solid"
                        color="secondary"
                        onPress={() => openPersonalInfoModal(trainer)}
                      >
                        <p>User Info</p>
                      </Button>
                      <Button
                        variant="solid"
                        color="secondary"
                        onPress={() => openBioModal(trainer)}
                      >
                        Bio
                      </Button>
                    </div>

                    {/* ✅ Actions Buttons */}
                    <div className="flex justify-center gap-3 mt-3">
                      <Button
                        variant="ghost"
                        color="primary"
                        onPress={() => openEditModal(trainer)}
                      >
                        <Pencil className="w-5 h-5" /> Edit
                      </Button>
                      <Button
                        variant="ghost"
                        color="danger"
                        onPress={() => console.log("Delete", trainer.id)}
                      >
                        <Trash className="w-5 h-5" /> Delete
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* ✅ Pagination Component */}
            <div className="flex justify-center mt-6">
              <Pagination
                total={Math.ceil(trainers.length / itemsPerPage)}
                page={currentPage}
                onChange={setCurrentPage}
                showControls
                color="primary"
              />
            </div>
          </>
        )}
      </div>

      {/* ✅ Modals */}
      <Add
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onUserAdded={fetchTrainers}
      />
      <Edit
        isOpen={editModalOpen}
        trainerId={selectedTrainerId}
        onClose={() => setEditModalOpen(false)}
        onTrainerUpdated={fetchTrainers}
      />

      {/* ✅ Image Preview Modal */}
      <Modal isOpen={isImageOpen} onClose={closeImageModal} size="lg">
        <ModalContent>
          <ModalHeader>Trainer Image</ModalHeader>
          <ModalBody className="flex justify-center">
            <Image
              src={selectedTrainerImage}
              alt="Enlarged Trainer Profile"
              className="w-full max-w-lg rounded-lg"
            />
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ✅ Personal Info Modal */}
      <Modal isOpen={isPersonalInfoOpen} onClose={closePersonalInfo}>
        <ModalContent>
          <ModalHeader>Personal Information</ModalHeader>
          <ModalBody>
            <p>
              <strong>Contact:</strong> {personalInfo?.user?.contact_number}
            </p>
            <p>
              <strong>Address:</strong> {personalInfo?.user?.address}
            </p>
            <p>
              <strong>Birthday:</strong> {personalInfo?.user?.birthday}
            </p>
            <p>
              <strong>Gender:</strong> {personalInfo?.user?.gender}
            </p>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* ✅ Bio Modal */}
      <Modal isOpen={isBioOpen} onClose={closeBio}>
        <ModalContent>
          <ModalHeader>Trainer Bio</ModalHeader>
          <ModalBody>{bioInfo}</ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
