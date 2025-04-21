import { useState, useEffect, useRef } from "react";
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
  useDraggable,
  Selection,
} from "@heroui/react";
import axios from "axios";
import { parseISO, format } from "date-fns";

const API_BASE = "http://127.0.0.1:8000";

interface Trainer {
  id: number;
  specialization: string;
  availability_schedule: string;
  bio: string;
  user: {
    id: number;
    name: string;
    email: string;
    contact_number: string;
    birthday: string;
    address: string;
    gender: "Male" | "Female" | "Prefer not to say";
  };
}

interface EditTrainerModalProps {
  isOpen: boolean;
  trainerId: number | null;
  onClose: () => void;
  onTrainerUpdated: () => void;
}

export default function EditTrainerModal({ isOpen, trainerId, onClose, onTrainerUpdated }: EditTrainerModalProps) {
  const [formData, setFormData] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetching, setFetching] = useState<boolean>(false);
  const targetRef = useRef(null);
  const { moveProps } = useDraggable({ targetRef, isDisabled: !isOpen });

  useEffect(() => {
    if (trainerId && isOpen) {
      fetchTrainerData(trainerId);
    }
  }, [trainerId, isOpen]);

  // ✅ Fetch Trainer Data from API
  const fetchTrainerData = async (id: number) => {
    setFetching(true);
    const token = localStorage.getItem("token"); // ✅ Use localStorage for token
    console.log("Fetching trainer data for ID:", id, "Token:", token);

    if (!token) {
      console.error("❌ No token found! User must log in.");
      setFetching(false);
      return;
    }

    try {
      const response = await axios.get<{ trainer: Trainer }>(`${API_BASE}/api/trainers/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true, // ✅ Required for Laravel Sanctum authentication
      });

      console.log("Trainer Data Response:", response.data);

      if (!response.data || !response.data.trainer) {
        console.error("❌ Trainer data missing in API response!", response.data);
        return;
      }

      setFormData({
        ...response.data.trainer,
        availability_schedule: response.data.trainer.availability_schedule
          ? format(parseISO(response.data.trainer.availability_schedule), "yyyy-MM-dd'T'HH:mm")
          : "",
      });
    } catch (err: any) {
      console.error("❌ Error fetching trainer data:", err.response?.data || err.message);
    } finally {
      setFetching(false);
    }
  };

  // ✅ Handle Input Change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (["name", "contact_number", "birthday", "address", "gender"].includes(name)) {
      setFormData((prev) =>
        prev ? { ...prev, user: { ...prev.user, [name]: value } } : null
      );
    } else {
      setFormData((prev) => (prev ? { ...prev, [name]: value } : null));
    }
  };

  // ✅ Handle Gender Selection
  const handleGenderChange = (keys: Selection) => {
    const selectedGender = Array.from(keys).join("") as "Male" | "Female" | "Prefer not to say";
    setFormData((prev) =>
      prev ? { ...prev, user: { ...prev.user, gender: selectedGender } } : null
    );
  };

  // ✅ Handle Form Submission (Update Trainer)
  const handleSubmit = async () => {
    if (!trainerId || !formData) return;
    setLoading(true);

    const token = localStorage.getItem("token"); // ✅ Use localStorage for token
    console.log("Token before update request:", token);

    if (!token) {
      console.error("❌ No token found! User must log in.");
      setLoading(false);
      return;
    }

    try {
      const formattedSchedule = formData.availability_schedule
        ? format(parseISO(formData.availability_schedule), "yyyy-MM-dd HH:mm:ss")
        : null;

      console.log("Updating Trainer with:", formData);

      await axios.put(`${API_BASE}/api/trainers/${trainerId}`, {
        name: formData.user.name,
        email: formData.user.email,
        contact_number: formData.user.contact_number,
        birthday: formData.user.birthday,
        address: formData.user.address,
        gender: formData.user.gender,
        specialization: formData.specialization,
        availability_schedule: formattedSchedule,
        bio: formData.bio,
      }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true, // ✅ Required for Laravel Sanctum authentication
      });

      console.log("✅ Trainer updated successfully.");
      onTrainerUpdated();
      onClose();
    } catch (err: any) {
      console.error("❌ Error updating trainer:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal ref={targetRef} isOpen={isOpen} size="md" onOpenChange={onClose} placement="center">
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader {...moveProps} className="flex justify-between">
              <h2 className="text-xl font-bold">Edit Trainer</h2>
            </ModalHeader>
            <ModalBody>
              {fetching ? (
                <p>Loading trainer details...</p>
              ) : formData ? (
                <div className="grid gap-4">
                  <Input label="Full Name" name="name" value={formData.user.name} onChange={handleChange} required />
                  <Input label="Contact Number" name="contact_number" value={formData.user.contact_number} onChange={handleChange} required />
                  <Input label="Birthday" name="birthday" type="date" value={formData.user.birthday} onChange={handleChange} required />
                  <Input label="Address" name="address" value={formData.user.address} onChange={handleChange} required />
                  <Select label="Gender" name="gender" selectedKeys={[formData.user.gender]} onSelectionChange={handleGenderChange} required>
                    <SelectItem key="Male">Male</SelectItem>
                    <SelectItem key="Female">Female</SelectItem>
                    <SelectItem key="Prefer not to say">Prefer not to say</SelectItem>
                  </Select>
                  <Input label="Specialization" name="specialization" value={formData.specialization} onChange={handleChange} required />
                  <Input label="Availability Schedule" name="availability_schedule" type="datetime-local" value={formData.availability_schedule} onChange={handleChange} required />
                  <Input label="Bio" name="bio" value={formData.bio} onChange={handleChange} required />
                </div>
              ) : (
                <p className="text-red-500">Trainer not found.</p>
              )}
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="flat" onPress={onCloseModal}>Close</Button>
              <Button color="primary" isLoading={loading} onPress={handleSubmit} disabled={fetching || !formData}>
                {loading ? "Updating..." : "Update Trainer"}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}