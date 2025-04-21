"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "@/components/sidebar_admin";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  Pagination,
  Modal,
  ModalContent
} from "@heroui/react";
import { Pencil, Trash } from "lucide-react";
import Add from "@/components/add_subs";
import Edit from "@/components/edit_subs";
import AddPersonalTrainerModal from "@/components/add_personal"; 
import EditPersonalTrainerModal from "@/components/edit_personal";  // Import the edit modal for personal trainers

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// For subscriptions we keep the same interface.
interface Subscription {
  id: number;
  plan_name: string;
  price: number;
  duration: string;
  features: string;
  status: "show" | "hide";
}

// Updated interface for personal trainers table, now including a 'name' field.
interface PersonalTrainer {
  id: number;
  name: string;
  session: number;
  price: number;
  features: string;
  image: string;
  status: "show" | "hide";
}

export default function Dashboard() {
  // dataRecords holds either subscriptions or personal trainer records.
  const [dataRecords, setDataRecords] = useState<(Subscription | PersonalTrainer)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  // We'll use separate states for editing subscriptions and personal trainers.
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<number | null>(null);
  const [selectedPersonalTrainerId, setSelectedPersonalTrainerId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [showPersonal, setShowPersonal] = useState(false);
  const rowsPerPage = 6;

  // State to handle the enlargement modal for images.
  const [enlargedImage, setEnlargedImage] = useState(false);
  const [enlargedImageSrc, setEnlargedImageSrc] = useState("");

  useEffect(() => {
    fetchData();
  }, [showPersonal]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const endpoint = showPersonal
        ? `${API_BASE}/api/personal_trainers`
        : `${API_BASE}/api/subscriptions`;

      const response = await axios.get(endpoint, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          Accept: "application/json",
        },
      });
      setDataRecords(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      setError("Failed to fetch data.");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const paginatedRecords = dataRecords.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  const pages = Math.ceil(dataRecords.length / rowsPerPage);

  const handleDelete = async (id: number) => {
    const confirmDelete = window.confirm("Are you sure?");
    if (!confirmDelete) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("No token found, please log in.");
      return;
    }

    try {
      if (showPersonal) {
        await axios.delete(`${API_BASE}/api/personal_trainers/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      } else {
        await axios.delete(`${API_BASE}/api/subscriptions/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
      }
      alert("Deleted successfully.");
      fetchData();
    } catch (err: any) {
      console.error("Error deleting:", err.response?.data || err.message);
      alert("Failed to delete. Check logs.");
    }
  };

  return (
    <div className="flex flex-col sm:flex-row overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 p-4 sm:p-6 transition-all duration-300 ml-0 sm:ml-60">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h1 className="text-2xl font-bold mb-2 sm:mb-0">
            {showPersonal ? "Personal Trainer Management" : "Subscription Management"}
          </h1>
          <Button
            variant="solid"
            color="primary"
            onPress={() => setModalOpen(true)}
            className="w-full sm:w-auto"
          >
            {showPersonal ? "Add Personal Trainer Subs" : "Add Subscription"}
          </Button>
        </div>

        {/* Checkbox Filter */}
        <div className="mb-4">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={showPersonal}
              onChange={(e) => {
                setShowPersonal(e.target.checked);
                setPage(1);
              }}
              className="form-checkbox"
            />
            <span className="ml-2">
              {showPersonal ? "Showing Personal Trainer Subscription" : "Show Personal Trainer Subscription"}
            </span>
          </label>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {loading ? (
            <p className="p-4 text-center text-gray-500">
              Loading {showPersonal ? "personal trainers" : "subscriptions"}...
            </p>
          ) : error ? (
            <p className="p-4 text-center text-red-500">{error}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table aria-label="Management Table" className="min-w-[700px]">
                  {showPersonal ? (
                    <TableHeader>
                      <TableColumn>NAME</TableColumn>
                      <TableColumn>SESSION</TableColumn>
                      <TableColumn>PRICE</TableColumn>
                      <TableColumn>FEATURES</TableColumn>
                      <TableColumn>IMAGE</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                  ) : (
                    <TableHeader>
                      <TableColumn>PLAN NAME</TableColumn>
                      <TableColumn>PRICE</TableColumn>
                      <TableColumn>DURATION</TableColumn>
                      <TableColumn>FEATURES</TableColumn>
                      <TableColumn>STATUS</TableColumn>
                      <TableColumn>ACTIONS</TableColumn>
                    </TableHeader>
                  )}
                  <TableBody>
                    {paginatedRecords.length > 0 ? (
                      showPersonal ? (
                        (paginatedRecords as PersonalTrainer[]).map((pt) => (
                          <TableRow key={pt.id} className="h-16">
                            <TableCell>{pt.name}</TableCell>
                            <TableCell>{pt.session}</TableCell>
                            <TableCell>
                              ₱{pt.price ? pt.price.toLocaleString() : "0"}
                            </TableCell>
                            <TableCell>{pt.features}</TableCell>
                            <TableCell>
                              {pt.image ? (
                                // Wrap the image in a button or clickable div.
                                <div 
                                  onClick={() => {
                                    setEnlargedImageSrc(pt.image);
                                    setEnlargedImage(true);
                                  }}
                                  className="cursor-pointer"
                                >
                                  <img
                                    src={pt.image}
                                    alt="Trainer"
                                    className="w-16 h-16 object-cover"
                                  />
                                </div>
                              ) : (
                                "N/A"
                              )}
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  pt.status === "show"
                                    ? "text-green-600 font-semibold"
                                    : "text-red-600 font-semibold"
                                }
                              >
                                {pt.status === "show" ? "Show" : "Hidden"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  color="primary"
                                  onPress={() => {
                                    setSelectedPersonalTrainerId(pt.id);
                                    setEditModalOpen(true);
                                  }}
                                >
                                  <Pencil className="w-5 h-5" /> Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  color="danger"
                                  onPress={() => handleDelete(pt.id)}
                                >
                                  <Trash className="w-5 h-5" /> Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        (paginatedRecords as Subscription[]).map((sub) => (
                          <TableRow key={sub.id} className="h-16">
                            <TableCell>{sub.plan_name}</TableCell>
                            <TableCell>
                              ₱{sub.price ? sub.price.toLocaleString() : "0"}
                            </TableCell>
                            <TableCell>{sub.duration}</TableCell>
                            <TableCell className="whitespace-pre-wrap">
                              {sub.features}
                            </TableCell>
                            <TableCell>
                              <span
                                className={
                                  sub.status === "show"
                                    ? "text-green-600 font-semibold"
                                    : "text-red-600 font-semibold"
                                }
                              >
                                {sub.status === "show" ? "Show" : "Hidden"}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  color="primary"
                                  onPress={() => {
                                    setSelectedSubscriptionId(sub.id);
                                    setEditModalOpen(true);
                                  }}
                                >
                                  <Pencil className="w-5 h-5" /> Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  color="danger"
                                  onPress={() => handleDelete(sub.id)}
                                >
                                  <Trash className="w-5 h-5" /> Delete
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={showPersonal ? 7 : 6}
                          className="text-center py-4 text-gray-500"
                        >
                          No {showPersonal ? "personal trainer records" : "subscriptions"} available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {pages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination total={pages} initialPage={page} onChange={setPage} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Conditionally render the appropriate Add modal */}
      {showPersonal ? (
        <AddPersonalTrainerModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onPersonalTrainerAdded={fetchData}
        />
      ) : (
        <Add
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubscriptionAdded={fetchData}
        />
      )}

      {/* Conditionally render the Edit modal: */}
      {showPersonal ? (
        <EditPersonalTrainerModal
          isOpen={editModalOpen}
          personalTrainerId={selectedPersonalTrainerId}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedPersonalTrainerId(null);
          }}
          onPersonalTrainerUpdated={fetchData}
        />
      ) : (
        <Edit
          isOpen={editModalOpen}
          subscriptionId={selectedSubscriptionId}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedSubscriptionId(null);
          }}
          onSubscriptionUpdated={fetchData}
        />
      )}

      {/* Image enlargement modal */}
      {enlargedImage && (
        <Modal
          isOpen={enlargedImage}
          onOpenChange={() => setEnlargedImage(false)}
          placement="center"
          classNames={{ backdrop: "bg-black/70" }}
        >
          <ModalContent>
            <div className="flex justify-center items-center p-4">
              <img
                src={enlargedImageSrc}
                alt="Enlarged Trainer"
                className="max-w-full max-h-screen"
                onClick={() => setEnlargedImage(false)}
              />
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
