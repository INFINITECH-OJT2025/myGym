"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardFooter,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
  addToast,
} from "@heroui/react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import Sidebar from "@/components/sidebar_admin";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// Data definitions for class summary
const summaryColumns = [
  { key: "name", label: "NAME" },
  { key: "scheduled_time", label: "SCHEDULED TIME" },
  { key: "difficulty", label: "DIFFICULTY" },
  { key: "attendees", label: "ATTENDEES" },
  { key: "reward_points", label: "REWARD POINTS" },
  { key: "actions", label: "View List" },
];

// Columns for the table inside the modal
const registrationColumns = [
  { key: "name", label: "Name" },
  { key: "gender", label: "Gender" },
  { key: "contact_number", label: "Contact Number" },
];

interface Class {
  show_class_id: number;
  name: string;
  scheduled_time: string;
  difficulty: string;
  attendees: number;
}

// Updated Registration interface: API returns full user details in a nested object.
interface Registration {
  user: {
    id: number;
    name: string;
    email: string;
    contact_number: string;
    birthday?: string;
    address?: string;
    gender: string;
    role?: string;
    image_url?: string;
  };
}

export default function ClassRegistrationSummary() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<number | null>(null);
  const [token, setToken] = useState<string>("");
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  // Track rewarded classes
  const [rewardedClasses, setRewardedClasses] = useState<Set<number>>(new Set());
  // New state: whether to show archived (ended) classes
  const [showArchived, setShowArchived] = useState(false);

  // On mount: retrieve token and rewarded classes from localStorage.
  useEffect(() => {
    const storedToken = localStorage.getItem("token") || "";
    setToken(storedToken);

    const savedRewarded = localStorage.getItem("rewardedClasses");
    if (savedRewarded) {
      try {
        const parsed = JSON.parse(savedRewarded);
        setRewardedClasses(new Set(parsed));
      } catch (error) {
        console.error("Error parsing rewardedClasses from localStorage:", error);
      }
    }
  }, []);

  // Fetch class summaries
  useEffect(() => {
    if (!token) return;
    fetch(`${API_BASE}/api/class_registrations/summary`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error fetching summary");
        return res.json();
      })
      .then((data) => setClasses(data))
      .catch((err) => console.error("Error fetching summary:", err));
  }, [token]);

  // Fetch registration list for the selected class
  const handleViewList = (showClassId: number) => {
    setSelectedClassId(showClassId);
    setSelectedKeys(new Set());
    fetch(`${API_BASE}/api/class_registrations/${showClassId}/list`, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error fetching registration list");
        return res.json();
      })
      .then((data: Registration[]) => {
        console.log("Fetched registrations:", data);
        setRegistrations(data);
        setShowModal(true);
      })
      .catch((err) => console.error("Error fetching registration list:", err));
  };

  // Batch deletion handler wrapped by a confirmation modal
  const handleDeleteSelected = async () => {
    if (selectedKeys.size === 0) {
      addToast({
        title: "Deletion Error",
        description:
          "No users selected. Please select one or more users to delete.",
        color: "warning",
        timeout: 4000,
        hideIcon: true,
      });
      return;
    }
    setShowConfirmDelete(true);
  };

  // Confirm deletion after modal confirmation
  const confirmDeletion = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/class_registrations/${selectedClassId}/delete_registrations`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ user_ids: Array.from(selectedKeys) }),
        }
      );
      if (!response.ok) {
        throw new Error("Error deleting registrations");
      }
      addToast({
        title: "Deletion Successful",
        description: "Selected registrations deleted successfully.",
        color: "success",
        timeout: 4000,
        hideIcon: true,
      });
      // Refresh the registration list after deletion
      handleViewList(selectedClassId!);
      setShowConfirmDelete(false);
    } catch (error) {
      console.error("Error deleting registrations:", error);
      addToast({
        title: "Deletion Failed",
        description: "Failed to delete registrations.",
        color: "danger",
        timeout: 4000,
        hideIcon: true,
      });
    }
  };

  // Function to handle awarding points based on class difficulty
  const handleRewardPoints = async (cls: Class) => {
    if (rewardedClasses.has(cls.show_class_id)) {
      addToast({
        title: "Already Rewarded!!",
        description: "Users for this class have already been rewarded.",
        color: "warning",
        timeout: 4000,
        hideIcon: true,
      });
      return;
    }

    let points = 0;
    const diff = cls.difficulty.toLowerCase();
    if (diff === "easy") points = 1;
    else if (diff === "hard") points = 2;
    else if (diff === "difficult") points = 3;
    else if (diff === "challenging") points = 4;

    try {
      const response = await fetch(
        `${API_BASE}/api/class_registrations/${cls.show_class_id}/award`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ points }),
        }
      );
      if (!response.ok) {
        throw new Error("Error awarding points");
      }
      setRewardedClasses((prev) => {
        const newSet = new Set(prev);
        newSet.add(cls.show_class_id);
        localStorage.setItem("rewardedClasses", JSON.stringify(Array.from(newSet)));
        return newSet;
      });
      addToast({
        title: "Success",
        description: "Points awarded successfully!",
        color: "success",
        timeout: 4000,
        hideIcon: true,
      });
    } catch (error) {
      console.error("Error awarding points: ", error);
      addToast({
        title: "Error",
        description: "Failed to award points.",
        color: "danger",
        timeout: 4000,
        hideIcon: true,
      });
    }
  };

  const handleCloseModal = () => setShowModal(false);

  // Compute active and archived classes based on scheduled_time
  const currentDate = new Date();
  const activeClasses = classes.filter((cls) => new Date(cls.scheduled_time) >= currentDate);
  const archivedClasses = classes.filter((cls) => new Date(cls.scheduled_time) < currentDate);

  // Map registrations to table rows:
  const rows = registrations.map((reg) => ({
    key: reg.user.id.toString(),
    name: reg.user.name,
    gender: reg.user.gender,
    contact_number: reg.user.contact_number,
  }));

  return (
    <div className="container mx-auto p-4">
      <Sidebar />
      <h1 className="text-2xl font-semibold mb-4">
        Class Registrations Summary
      </h1>

      {/* Render Active Classes as Cards */}
      {activeClasses.length > 0 ? (
        activeClasses.map((cls) => (
          <Card key={cls.show_class_id} className="mb-4">
            <CardBody>
              <p>
                <strong>{summaryColumns[0].label}:</strong> {cls.name}
              </p>
              <p>
                <strong>{summaryColumns[1].label}:</strong> {cls.scheduled_time}
              </p>
              <p>
                <strong>{summaryColumns[2].label}:</strong> {cls.difficulty}
              </p>
              <p>
                <strong>{summaryColumns[3].label}:</strong> {cls.attendees}
              </p>
              <p>
                <strong>{summaryColumns[4].label}:</strong>{" "}
                <Button
                  variant="solid"
                  size="sm"
                  onPress={() => handleRewardPoints(cls)}
                  disabled={rewardedClasses.has(cls.show_class_id)}
                  color={
                    rewardedClasses.has(cls.show_class_id)
                      ? "success"
                      : "primary"
                  }
                >
                  {rewardedClasses.has(cls.show_class_id)
                    ? "Rewarded"
                    : "Reward Points"}
                </Button>
              </p>
            </CardBody>
            <CardFooter className="flex justify-end">
              <Button
                size="sm"
                onPress={() => handleViewList(cls.show_class_id)}
              >
                {summaryColumns[5].label}
              </Button>
            </CardFooter>
          </Card>
        ))
      ) : (
        <p>No active classes found.</p>
      )}

      {/* Archive Checkbox */}
      <div className="my-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="form-checkbox"
          />
          <span className="ml-2">Show Archived Classes</span>
        </label>
      </div>

      {/* Render Archived Classes if checkbox is checked */}
      {showArchived && archivedClasses.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Archived Classes</h2>
          {archivedClasses.map((cls) => (
            <Card key={cls.show_class_id} className="mb-4">
              <CardBody>
                <p>
                  <strong>{summaryColumns[0].label}:</strong> {cls.name}
                </p>
                <p>
                  <strong>{summaryColumns[1].label}:</strong> {cls.scheduled_time}
                </p>
                <p>
                  <strong>{summaryColumns[2].label}:</strong> {cls.difficulty}
                </p>
                <p>
                  <strong>{summaryColumns[3].label}:</strong> {cls.attendees}
                </p>
                <p>
                  <strong>{summaryColumns[4].label}:</strong>{" "}
                  <Button
                    variant="solid"
                    size="sm"
                    onPress={() => handleRewardPoints(cls)}
                    disabled={rewardedClasses.has(cls.show_class_id)}
                    color={
                      rewardedClasses.has(cls.show_class_id)
                        ? "success"
                        : "primary"
                    }
                  >
                    {rewardedClasses.has(cls.show_class_id)
                      ? "Rewarded"
                      : "Reward Points"}
                  </Button>
                </p>
              </CardBody>
              <CardFooter className="flex justify-end">
                <Button
                  size="sm"
                  onPress={() => handleViewList(cls.show_class_id)}
                >
                  {summaryColumns[5].label}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal displaying registration list as a table with multi-selection */}
      <Modal isOpen={showModal} onClose={handleCloseModal}>
        <ModalContent>
          <ModalHeader>
            <h5>
              Registration List for Class{" "}
              {
                classes.find((cls) => cls.show_class_id === selectedClassId)
                  ?.name
              }
            </h5>
          </ModalHeader>
          <ModalBody>
            {registrations.length > 0 ? (
              <Table
                aria-label="Registrations table"
                selectedKeys={selectedKeys}
                selectionMode="multiple"
                onSelectionChange={(keys) => {
                  if (keys instanceof Set) {
                    setSelectedKeys(new Set(Array.from(keys) as string[]));
                  }
                }}
              >
                <TableHeader columns={registrationColumns}>
                  {(column) => (
                    <TableColumn key={column.key}>
                      {column.label}
                    </TableColumn>
                  )}
                </TableHeader>
                <TableBody items={rows}>
                  {(item) => (
                    <TableRow key={item.key}>
                      {(columnKey) => (
                        <TableCell>{getKeyValue(item, columnKey)}</TableCell>
                      )}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              <p>No registrations found.</p>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              size="sm"
              variant="solid"
              onPress={handleDeleteSelected}
            >
              Delete
            </Button>
            <Button size="sm" variant="solid" onPress={handleCloseModal}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Confirmation Modal for deletion */}
      <Modal
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
      >
        <ModalContent>
          <ModalHeader>
            <h5>Confirm Deletion</h5>
          </ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete the selected users?</p>
          </ModalBody>
          <ModalFooter>
            <Button
              size="sm"
              variant="solid"
              color="danger"
              onPress={() => setShowConfirmDelete(false)}
            >
              Cancel
            </Button>
            <Button
              color="success"
              size="sm"
              variant="solid"
              onPress={confirmDeletion}
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <style jsx>{`
        .container {
          max-width: 800px;
        }
      `}</style>
    </div>
  );
}
