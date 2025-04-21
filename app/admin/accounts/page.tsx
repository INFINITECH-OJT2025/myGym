"use client";

import React, { useState, useEffect, useMemo, useRef, Key } from "react";
import axios from "axios";
import Sidebar from "@/components/sidebar_admin";
import {
  Card,
  CardHeader,
  CardBody,
  Image,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  useDraggable,
  Button,
  Pagination,
  Autocomplete,
  AutocompleteItem,
} from "@heroui/react";
import { Pencil, Trash } from "lucide-react";
import Add from "@/components/add";
import Edit from "@/components/edit";
import { addToast } from "@heroui/react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface User {
  id: number;
  name: string;
  email: string;
  contact_number: string;
  birthday: string;
  address: string;
  gender: "Male" | "Female" | "Prefer not to say";
  role: "member";
  image: string | null;
}

interface UserOption {
  key: string;
  text: string;
}

// Role colors
const roleColors: { [key: string]: string } = {
  member: "bg-blue-500 text-white",
  trainer: "bg-orange-500 text-white",
  admin: "bg-red-500 text-white",
};

export default function AccountsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 3;
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const targetRef = useRef(null);
  const { moveProps } = useDraggable({ targetRef, isDisabled: !isOpen });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const totalPages = Math.ceil(users.length / rowsPerPage);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKey, setSelectedKey] = useState<Key | null>(null);
  const [options, setOptions] = useState<UserOption[]>([]);

  useEffect(() => {
    fetchUsers();
    setPage(1);
  }, [searchQuery]);

  const fetchUsers = async () => {
    try {
      console.log("🚀 Fetching users...");
      const token = localStorage.getItem("token");

      if (!token) {
        console.error("❌ No token found! User must log in.");
        return;
      }

      const response = await axios.get(`${API_BASE}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        withCredentials: true,
      });

      console.log("✅ API Response:", response.data);

      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error("❌ Unexpected API response structure:", response.data);
        setUsers([]);
      }
    } catch (err: any) {
      console.error(
        "❌ Error fetching users:",
        err.response?.data || err.message
      );
      setError("Failed to fetch users.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (userId: number) => {
    setSelectedUserId(userId);
    setEditModalOpen(true);
  };

  const handleDelete = async (userId: number) => {
    addToast({
      title: "Successfully Deleted",
      description: `User ${users.find((user) => user.id === userId)?.name || "Unknown"} has been deleted.`,
      color: "success",
      variant: "flat",
      timeout: 2000,
      hideIcon: true,
      classNames: {
        closeButton: "show",
      },
    });

    try {
      await axios.delete(`${API_BASE}/api/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
        withCredentials: true,
      });

      console.log("✅ User deleted successfully.");

      setUsers((prevUsers) => {
        const updatedUsers = prevUsers.filter((user) => user.id !== userId);

        const totalAfterDelete = updatedUsers.length;
        const maxPage = Math.ceil(totalAfterDelete / rowsPerPage);

        // 👇 If current page is now out of range, go back one page
        if (page > maxPage && page > 1) {
          setPage(page - 1);
        }

        return updatedUsers;
      });
    } catch (err) {
      console.error("❌ Error deleting user:", err);
    }
  };

  // ✅ Fix Pagination: Ensure correct range
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();

    return users.filter((user) =>
      [
        user.name,
        user.email,
        user.role,
        user.contact_number,
        user.gender,
        user.address,
      ].some((field) => field?.toLowerCase().includes(query))
    );
  }, [users, searchQuery]);

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredUsers.slice(start, start + rowsPerPage);
  }, [page, filteredUsers]);

  // const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  return (
    <div className="flex min-h-screen overflow-hidden ">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 transition-all duration-300 w-full md:ml-[250px] lg:ml-[280px] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center mb-4">
          <Autocomplete
            allowsCustomValue
            label="Search user info"
            variant="bordered"
            placeholder="Search name, email, role..."
            className="w-full sm:max-w-xs"
            onInputChange={(value) => setSearchQuery(value)}
            items={options} // now items is UserOption[]
          >
            {(item) => (
              <AutocompleteItem key={item.key}>{item.text}</AutocompleteItem>
            )}
          </Autocomplete>

          <Button
            variant="solid"
            color="primary"
            className="w-full sm:w-auto"
            onPress={() => setModalOpen(true)}
          >
            Add User
          </Button>
        </div>

        {/* Users Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 mx-auto max-w-[1300px]">
          {paginatedUsers.length > 0 ? (
            paginatedUsers.map((user) => (
              <Card
                key={user.id}
                className="shadow-lg p-5 flex flex-col w-full min-h-[460px] relative"
              >
                {/* Image Preview Button - Positioned in Top Right */}
                <div className="absolute top-2 right-2 flex flex-col items-center gap-1 z-[20] pointer-events-auto">
                  <div className="w-[50px] h-[50px] rounded-full overflow-hidden border border-gray-300 bg-white shadow-sm flex items-center justify-center relative">
                    {user.image ? (
                      <Image
                        alt="Profile Image"
                        className="object-cover w-full h-full"
                        src={`${API_BASE}/profile_pictures/${user.image}`}
                      />
                    ) : (
                      <span className="text-gray-500 text-xs">No Image</span>
                    )}
                  </div>

                  {user.image && (
                    <button
                      onClick={() => {
                        setSelectedImage(
                          `${API_BASE}/profile_pictures/${user.image}`
                        );
                        onOpen();
                      }}
                      className="px-2 py-1 text-xs font-semibold text-white bg-blue-500 rounded-md shadow hover:bg-blue-600 transition focus:outline-none focus:ring focus:ring-blue-300"
                    >
                      View
                    </button>
                  )}
                </div>

                {/* User Name & Role with Color */}
                <CardHeader className="pb-2 pt-2 px-4 flex flex-col items-start">
                  <h4 className="font-bold text-lg">{user.name}</h4>
                  <span
                    className={`px-2 py-1 text-sm font-semibold rounded-md ${roleColors[user.role]}`}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </CardHeader>

                {/* Card Body */}
                <CardBody className="overflow-visible py-2 flex flex-col">
                  {/* Email */}
                  <p className="text-sm text-gray-600 font-semibold">Email:</p>
                  <p className="text-sm text-gray-500">{user.email}</p>

                  {/* Contact Number */}
                  <p className="text-sm text-gray-600 font-semibold mt-2">
                    Contact:
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.contact_number || "No Contact"}
                  </p>

                  {/* Gender */}
                  <p className="text-sm text-gray-600 font-semibold mt-2">
                    Gender:
                  </p>
                  <p className="text-sm text-gray-500">{user.gender}</p>

                  {/* Birthday */}
                  <p className="text-sm text-gray-600 font-semibold mt-2">
                    Birthday:
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.birthday
                      ? new Date(user.birthday).toLocaleDateString()
                      : "No Birthday"}
                  </p>

                  {/* Address */}
                  <p className="text-sm text-gray-600 font-semibold mt-2">
                    Address:
                  </p>
                  <p className="text-sm text-gray-500">
                    {user.address || "No Address"}
                  </p>
                </CardBody>

                {/* Edit & Delete Buttons - Fixed at Bottom */}
                <div className="absolute bottom-4 left-0 w-full px-4 flex justify-between">
                  <Button
                    variant="ghost"
                    color="primary"
                    onPress={() => openEditModal(user.id)}
                  >
                    <Pencil className="w-5 h-5" /> Edit
                  </Button>
                  <Button
                    variant="ghost"
                    color="danger"
                    onPress={() => {
                      setUserToDelete(user.id); // store selected user
                      setShowDeleteModal(true); // open modal
                    }}
                  >
                    <Trash className="w-5 h-5" /> Delete
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-center py-6 text-gray-500">No users found.</p>
          )}
        </div>
        <div className="flex justify-center mt-6"></div>
        {/* ✅ Pagination Component */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6">
            <Pagination
              loop
              showControls
              color="primary"
              initialPage={page}
              total={totalPages}
              onChange={(newPage) => setPage(newPage)}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      <Add
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onUserAdded={fetchUsers}
      />
      <Edit
        isOpen={editModalOpen}
        userId={selectedUserId}
        onClose={() => setEditModalOpen(false)}
        onUserUpdated={fetchUsers}
      />

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

      <Modal isOpen={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <ModalContent>
          <ModalHeader>Confirm Deletion</ModalHeader>
          <ModalBody>
            Are you sure you want to delete?
            <strong>
              {users.find((user) => user.id === userToDelete)?.name ||
                "this user"}
            </strong>
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
