"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Input,
  addToast,
  Select,
  SelectItem,
  Textarea,
} from "@heroui/react";

interface ClassItem {
  id: number;
  name: string;
  class_type_id: number;
  description: string;
  schedule_time: string;
  difficulty: string;
  duration: string;
  max_participants: number;
  trainer?: {
    id: number;
    user?: {
      id: number;
      name: string;
    };
  };
}

interface ClassType {
  id: number;
  name: string;
}

interface Trainer {
  id: number;
  user: {
    id: number;
    name: string;
  };
  specialization: string;
  availability_schedule: string;
  bio: string;
}

interface EditClassesModalProps {
  isOpen: boolean;
  onClose: () => void;
  classItem: ClassItem | null;
  onClassUpdated: () => void;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

const EditClassesModal: React.FC<EditClassesModalProps> = ({
  isOpen,
  onClose,
  classItem,
  onClassUpdated,
}) => {
  // Update form state to include trainer_id instead of trainer_name.
  const [formData, setFormData] = useState({
    name: "",
    trainer_id: "",
    class_type_id: "",
    description: "",
    schedule_time: "",
    difficulty: "",
    duration: "",
    max_participants: "",
  });

  const [initialData, setInitialData] = useState(formData);

  // State for class type options.
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);
  // State for trainers.
  const [trainers, setTrainers] = useState<Trainer[]>([]);

  // Compute min value for datetime-local input (today at 04:00).
  const getMinDateTime = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}T04:00`;
  };
  const minDateTime = getMinDateTime();

  // Fetch available class types.
  useEffect(() => {
    axios
      .get<ClassType[] | { classTypes: ClassType[] }>(`${API_BASE}/api/class-types`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(({ data }) => {
        const typesArray = Array.isArray(data) ? data : data.classTypes || data;
        setClassTypes(typesArray);
      })
      .catch((error) => {
        console.error("Error fetching class types:", error);
        addToast({
          title: "Error",
          description: "Failed to fetch class types",
          color: "danger",
          timeout: 3000,
        });
      });
  }, []);

  // Fetch available trainers.
  useEffect(() => {
    axios
      .get<{ trainers?: Trainer[] } | Trainer[]>(`${API_BASE}/api/trainers`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
      .then(({ data }) => {
        const trainersArray = Array.isArray(data) ? data : data.trainers || [];
        setTrainers(trainersArray);
      })
      .catch((error) => {
        console.error("Error fetching trainers:", error);
        addToast({
          title: "Error",
          description: "Failed to fetch trainers",
          color: "danger",
          timeout: 3000,
        });
      });
  }, []);

  // Prepopulate the form when classItem changes.
  useEffect(() => {
    if (classItem) {
      // Convert "YYYY-MM-DD HH:mm:ss" to "YYYY-MM-DDTHH:mm" for the datetime-local input
      const scheduleTimeForInput = classItem.schedule_time.replace(" ", "T").slice(0, 16);
      const data = {
        name: classItem.name,
        trainer_id: classItem.trainer ? classItem.trainer.id.toString() : "",
        class_type_id: classItem.class_type_id.toString(),
        description: classItem.description,
        schedule_time: scheduleTimeForInput,
        difficulty: classItem.difficulty,
        duration: classItem.duration,
        max_participants: classItem.max_participants.toString(),
      };
      setFormData(data);
      setInitialData(data);
    }
  }, [classItem]);

  // Custom handler to enforce allowed time range (04:00 to 20:00)
  const handleScheduleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value; // Expected format: "YYYY-MM-DDTHH:mm"
    const parts = value.split("T");
    if (parts.length === 2) {
      const timeParts = parts[1].split(":");
      const hour = parseInt(timeParts[0]);
      const minute = parseInt(timeParts[1]);
      // Disallow times earlier than 04:00 or later than 20:00.
      // Allowed range: 04:00 <= time <= 20:00 (if exactly 20:00, minutes must be 0).
      if (hour < 4 || hour > 20 || (hour === 20 && minute > 0)) {
        addToast({
          title: "Error",
          description: "Schedule time must be between 04:00AM and 08:00PM",
          color: "danger",
          timeout: 3000,
        });
        return;
      }
    }
    setFormData({ ...formData, schedule_time: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const requiredFields = [
      "name",
      "trainer_id",
      "class_type_id",
      "description",
      "schedule_time",
      "difficulty",
      "duration",
      "max_participants",
    ];
    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        addToast({
          title: "Error",
          description: `Missing required field: ${field}`,
          color: "danger",
          timeout: 3000,
        });
        return;
      }
    }

    const unchanged =
      formData.name === initialData.name &&
      formData.trainer_id === initialData.trainer_id &&
      formData.class_type_id === initialData.class_type_id &&
      formData.description === initialData.description &&
      formData.schedule_time.slice(0, 16) === initialData.schedule_time.slice(0, 16) &&
      formData.difficulty === initialData.difficulty &&
      formData.duration === initialData.duration &&
      formData.max_participants === initialData.max_participants;

    if (unchanged) {
      addToast({
        title: "Warning",
        description: "No changes were made.",
        color: "warning",
        timeout: 3000,
      });
      return;
    }

    // Convert the schedule_time from "YYYY-MM-DDTHH:mm" to "YYYY-MM-DD HH:mm:ss"
    const formattedScheduleTime = formData.schedule_time.replace("T", " ") + ":00";

    try {
      await axios.put(
        `${API_BASE}/api/classes/${classItem?.id}`,
        {
          name: formData.name,
          trainer_id: parseInt(formData.trainer_id),
          class_type_id: parseInt(formData.class_type_id),
          description: formData.description,
          schedule_time: formattedScheduleTime,
          difficulty: formData.difficulty,
          duration: formData.duration,
          max_participants: parseInt(formData.max_participants),
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      addToast({
        title: "Success",
        description: "Class updated successfully",
        color: "success",
        timeout: 2000,
      });
      onClassUpdated();
      onClose();
    } catch (error) {
      console.error("Error updating class:", error);
      addToast({
        title: "Error",
        description: "Failed to update class",
        color: "danger",
        timeout: 3000,
      });
    }
  };

  if (!isOpen || !classItem) return null;

  const setDescription = (value: string): void => {
    setFormData({ ...formData, description: value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader>Edit Class</ModalHeader>
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-3">
              {/* Left Column */}
              <div className="flex flex-col gap-2">
                <Select
                  label="Class Type"
                  name="class_type_id"
                  selectedKeys={[formData.class_type_id]}
                  onSelectionChange={(keys) =>
                    setFormData({
                      ...formData,
                      class_type_id: String(Array.from(keys)[0]),
                    })
                  }
                  required
                  className="text-sm w-full"
                >
                  <SelectItem key="">Select Class Type</SelectItem>
                  <React.Fragment>
                    {classTypes.map((ct) => (
                      <SelectItem key={ct.id.toString()}>{ct.name}</SelectItem>
                    ))}
                  </React.Fragment>
                </Select>

                <Input
                  type="text"
                  name="name"
                  label="Class Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full"
                />

                <Select
                  label="Difficulty"
                  name="difficulty"
                  selectedKeys={[formData.difficulty]}
                  onSelectionChange={(keys) =>
                    setFormData({
                      ...formData,
                      difficulty: String(Array.from(keys)[0]),
                    })
                  }
                  required
                  className="text-sm w-full"
                >
                  <SelectItem key="">Select Difficulty</SelectItem>
                  <SelectItem key="easy">easy</SelectItem>
                  <SelectItem key="hard">hard</SelectItem>
                  <SelectItem key="difficult">difficult</SelectItem>
                  <SelectItem key="challenging">challenging</SelectItem>
                </Select>
              </div>

              {/* Right Column */}
              <div className="flex flex-col gap-2">
                <Select
                  label="Duration"
                  name="duration"
                  selectedKeys={[formData.duration]}
                  onSelectionChange={(keys) =>
                    setFormData({
                      ...formData,
                      duration: String(Array.from(keys)[0]),
                    })
                  }
                  required
                  className="text-sm w-full"
                >
                  <SelectItem key="">Select Duration</SelectItem>
                  <SelectItem key="30 mins">30 mins</SelectItem>
                  <SelectItem key="45 mins">45 mins</SelectItem>
                  <SelectItem key="60 mins">60 mins</SelectItem>
                  <SelectItem key="90 mins">90 mins</SelectItem>
                </Select>

                <Input
                  type="number"
                  name="max_participants"
                  label="Max Participants"
                  value={formData.max_participants}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      max_participants: e.target.value,
                    })
                  }
                  className="w-full"
                />

                <Select
                  label="Trainer"
                  name="trainer_id"
                  selectedKeys={[formData.trainer_id]}
                  onSelectionChange={(keys) =>
                    setFormData({
                      ...formData,
                      trainer_id: String(Array.from(keys)[0]),
                    })
                  }
                  required
                  className="text-sm w-full"
                >
                  <>
                    <SelectItem key="">Select Trainer</SelectItem>
                    {trainers.map((trainer) => (
                      <SelectItem key={trainer.id.toString()}>
                        {trainer.user.name}
                      </SelectItem>
                    ))}
                  </>
                </Select>
              </div>
            </div>

            {/* Schedule Time & Description */}
            <div className="mt-2">
              <Input
                type="datetime-local"
                name="schedule_time"
                label="Schedule Time"
                value={formData.schedule_time ? formData.schedule_time.slice(0, 16) : ""}
                onChange={handleScheduleTimeChange}
                min={minDateTime}
                className="w-full pb-2"
              />
              <Textarea
                label="Description"
                placeholder="Enter your description. Use Shift+Enter for new lines."
                value={formData.description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pb-2"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 mt-4">
              <Button color="default" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" type="submit">
                Update Class
              </Button>
            </div>
          </form>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default EditClassesModal;
