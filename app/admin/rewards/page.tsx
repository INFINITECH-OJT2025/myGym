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
} from "@heroui/react";
import { Pencil, Trash } from "lucide-react";
import AddRewardModal from "@/components/add_reward"; // Ensure this component is created and available
import EditRewardModal from "@/components/edit_reward"; // See component code below

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// Define the Reward interface corresponding to the rewards table.
interface Reward {
  id: number;
  item: string;
  image: string;
  cost_points: number;
}

export default function RewardsDashboard() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRewardId, setSelectedRewardId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const rowsPerPage = 6;

  // Function to fetch rewards from the API.
  const fetchRewards = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get<Reward[]>(`${API_BASE}/api/rewards`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
          Accept: "application/json",
        },
      });
      setRewards(response.data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch rewards");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const paginatedRewards = rewards.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );
  const pages = Math.ceil(rewards.length / rowsPerPage);

  return (
    <div className="flex flex-col sm:flex-row min-h-screen overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6 transition-all duration-300 ml-0 sm:ml-60">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
          <h1 className="text-2xl font-bold mb-2 sm:mb-0 text-gray-900">
            Rewards Management
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="solid"
              color="primary"
              onPress={() => setAddModalOpen(true)}
              className="w-full sm:w-auto"
            >
              Add Reward
            </Button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden w-full">
          {loading ? (
            <p className="p-4 text-center text-gray-500">Loading rewards...</p>
          ) : error ? (
            <p className="p-4 text-center text-red-500">{error}</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table aria-label="Rewards Table" className="w-full">
                  <TableHeader>
                    <TableColumn className="px-4 py-2">ITEM</TableColumn>
                    <TableColumn className="px-4 py-2">IMAGE</TableColumn>
                    <TableColumn className="px-4 py-2">COST POINTS</TableColumn>
                    <TableColumn className="px-4 py-2 text-right">
                      ACTIONS
                    </TableColumn>
                  </TableHeader>
                  <TableBody>
                    {paginatedRewards.length > 0 ? (
                      paginatedRewards.map((reward) => (
                        <TableRow key={reward.id} className="h-16 border-b">
                          <TableCell className="px-4 py-2">
                            {reward.item}
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            {reward.image ? (
                              <img
                                src={reward.image}
                                alt={reward.item}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            {reward.cost_points}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                color="primary"
                                onPress={() => {
                                  setSelectedRewardId(reward.id);
                                  setEditModalOpen(true);
                                }}
                              >
                                <Pencil className="w-5 h-5" /> Edit
                              </Button>
                              <Button
                                variant="ghost"
                                color="danger"
                                onPress={async () => {
                                  const confirmDelete = window.confirm(
                                    "Are you sure you want to delete this reward?"
                                  );
                                  if (confirmDelete && reward.id) {
                                    try {
                                      const token =
                                        localStorage.getItem("token");
                                      await axios.delete(
                                        `${API_BASE}/api/rewards/${reward.id}`,
                                        {
                                          headers: {
                                            ...(token && {
                                              Authorization: `Bearer ${token}`,
                                            }),
                                            Accept: "application/json",
                                          },
                                        }
                                      );
                                      // Refresh or update rewards list after deletion
                                      fetchRewards();
                                    } catch (err: any) {
                                      alert(
                                        err.response?.data?.message ||
                                          "Failed to delete reward."
                                      );
                                    }
                                  }
                                }}
                              >
                                <Trash className="w-5 h-5" /> Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-gray-500"
                        >
                          No rewards available.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              {pages > 1 && (
                <div className="flex justify-center mt-4">
                  <Pagination
                    total={pages}
                    initialPage={page}
                    onChange={setPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Reward Modal */}
      <AddRewardModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onRewardAdded={fetchRewards}
      />

      {/* Edit Reward Modal */}
      {editModalOpen && (
        <EditRewardModal
          isOpen={editModalOpen}
          rewardId={selectedRewardId}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedRewardId(null);
          }}
          onRewardUpdated={fetchRewards}
        />
      )}
    </div>
  );
}
