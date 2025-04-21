import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Textarea,
  addToast,
} from "@heroui/react";
import axios from "axios";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// Utility function to format a Date to "YYYY-MM-DDTHH:MM" for datetime-local input
const formatDateForInput = (date) => {
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
};

export default function AddClassesModal({ isOpen, onClose, onClassAdded }) {
  const [trainers, setTrainers] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const defaultFormData = {
    name: "",
    trainer_id: "",
    facilities_id: "1",
    class_type_id: "",
    description: "",
    schedule_time: "",
    difficulty: "easy",
    duration: "",
    max_participants: "",
  };

  const [formData, setFormData] = useState(defaultFormData);

  // Compute the minimum allowed schedule time (disable previous dates)
  const getMinScheduleTime = () => {
    const now = new Date();
    let minDate;
    if (now.getHours() < 4) {
      // Before 4AM, allow today's 4AM as the minimum.
      minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 4, 0, 0, 0);
    } else if (now.getHours() >= 20) {
      // After 8PM, set minimum to tomorrow 4AM.
      minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 4, 0, 0, 0);
    } else {
      // Within allowed window: ensure users cannot pick a past time.
      minDate = now;
    }
    return formatDateForInput(minDate);
  };

  const minScheduleTime = getMinScheduleTime();

  useEffect(() => {
    if (!isOpen) {
      setFormData(defaultFormData);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };

      axios
        .get(`${API_BASE}/api/trainers`, { headers })
        .then(({ data }) => {
          if (Array.isArray(data.trainers)) {
            setTrainers(data.trainers);
          } else {
            console.warn("Unexpected trainers response:", data);
            setTrainers([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching trainers:", err);
          setTrainers([]);
        });

      axios
        .get(`${API_BASE}/api/class-types`, { headers })
        .then(({ data }) => {
          if (Array.isArray(data)) {
            setClassTypes(data);
          } else {
            console.warn("Unexpected classTypes response:", data);
            setClassTypes([]);
          }
        })
        .catch((err) => {
          console.error("Error fetching class types:", err);
          setClassTypes([]);
        });
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    // Validate schedule_time exists
    if (!formData.schedule_time) {
      addToast({
        title: "Error",
        description: "Schedule time is required",
        color: "danger",
        timeout: 3000,
      });
      return;
    }
    const scheduleDate = new Date(formData.schedule_time);
    const now = new Date();
    // Ensure schedule is in the future.
    if (scheduleDate < now) {
      addToast({
        title: "Error",
        description: "Schedule time must be in the future",
        color: "danger",
        timeout: 3000,
      });
      return;
    }
    // Validate the time portion is between 4AM and 8PM.
    const hour = scheduleDate.getHours();
    const minutes = scheduleDate.getMinutes();
    if (hour < 4 || hour > 20 || (hour === 20 && minutes > 0)) {
      addToast({
        title: "Error",
        description: "Schedule time must be between 4AM and 8PM",
        color: "danger",
        timeout: 3000,
      });
      return;
    }

    try {
      const payload = {
        name: formData.name,
        trainer_id: formData.trainer_id,
        facilities_id: formData.facilities_id,
        class_type_id: formData.class_type_id,
        description: formData.description,
        schedule_time: formData.schedule_time,
        difficulty: formData.difficulty,
        duration: formData.duration,
        max_participants:
          formData.max_participants === "" ? "many" : formData.max_participants,
      };

      await axios.post(`${API_BASE}/api/classes`, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      addToast({
        title: "Success",
        description: "Class added successfully",
        color: "success",
        timeout: 3000,
      });

      onClassAdded();
    } catch (err) {
      if (err.response && err.response.data && err.response.data.errors) {
        const errors = err.response.data.errors;
        // Iterate over each field error and display a toast for each.
        for (const field in errors) {
          errors[field].forEach((msg) => {
            addToast({
              title: "Error",
              description: msg,
              color: "danger",
              timeout: 3000,
            });
          });
        }
      } else {
        addToast({
          title: "Error",
          description: "An unexpected error occurred.",
          color: "danger",
          timeout: 3000,
        });
      }
      console.error("Error adding class:", err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalContent>
        <ModalHeader>Add New Class</ModalHeader>
        <ModalBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Class Name</label>
            <Input name="name" value={formData.name} onChange={handleChange} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Trainer</label>
            <Select
              name="trainer_id"
              selectedKeys={[formData.trainer_id]}
              onSelectionChange={(keys) =>
                setFormData((p) => ({ ...p, trainer_id: Array.from(keys)[0] }))
              }
            >
              {trainers.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.user?.name || `Trainer ${t.id}`}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Class Type</label>
            <Select
              name="class_type_id"
              selectedKeys={[formData.class_type_id]}
              onSelectionChange={(keys) =>
                setFormData((p) => ({
                  ...p,
                  class_type_id: Array.from(keys)[0],
                }))
              }
            >
              {classTypes.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Schedule Time
            </label>
            <Input
              name="schedule_time"
              type="datetime-local"
              value={formData.schedule_time}
              onChange={handleChange}
              min={minScheduleTime}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Duration</label>
            <Select
              name="duration"
              selectedKeys={[formData.duration]}
              onSelectionChange={(keys) =>
                setFormData((p) => ({ ...p, duration: Array.from(keys)[0] }))
              }
            >
              {["30 mins", "45 mins", "60 mins", "90 mins"].map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">
              Max Participants
            </label>
            <Input
              name="max_participants"
              type="text"
              value={formData.max_participants}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Difficulty</label>
            <Select
              name="difficulty"
              selectedKeys={[formData.difficulty]}
              onSelectionChange={(keys) =>
                setFormData((p) => ({ ...p, difficulty: String(Array.from(keys)[0]) }))
              }
            >
              {["easy", "hard", "difficult", "challenging"].map((d) => (
                <SelectItem key={d}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div className="md:col-span-2">
            <label className="text-sm font-medium mb-1 block">
              Description
            </label>
            <Textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              minRows={3}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button onPress={onClose} variant="flat">
            Cancel
          </Button>
          <Button color="primary" onPress={handleSubmit}>
            Save Class
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
