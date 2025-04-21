"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar_member";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Button,
  Spinner,
} from "@heroui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import RedeemPointsModal, { Reward } from "@/components/RedeemPointsModal";
import RedemptionHistoryModal from "@/components/RedemptionHistoryModal";
import EditProfileModal, { UserProfile } from "@/components/edit_profile";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// Define the local UserProfile interface.
interface UserProfileLocal {
  name: string;
  email: string;
  image: string | null;
  email_verified_at?: string | null;
  contact_number: string;
  birthday: string;
  address: string;
  gender: string;
  role: string;
  loyalty_points_total: number;
}

interface PointsHistory {
  id: number;
  date: string;
  description: string;
  points: number;
}

// Helper function to format dates.
function formatBirthday(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function MyProfilePage() {
  const [user, setUser] = useState<UserProfileLocal | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  // Modal states.
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [showRedeemOptions, setShowRedeemOptions] = useState<boolean>(false);
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);

  // Maintain redemption history in parent state.
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([]);

  // Fetch the authenticated user's details.
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setError("User is not authenticated.");
          setLoading(false);
          return;
        }
        const response = await axios.get<UserProfileLocal>(
          `${API_BASE}/api/user`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );
        setUser(response.data);
      } catch (err: any) {
        setError(err.message || "Failed to fetch user data.");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // Function to fetch redemption history.
  const fetchPointsHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) return;
      const response = await axios.get<PointsHistory[]>(
        `${API_BASE}/api/points-history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      console.log("Raw points history response:", response.data);

      // Filter transactions, ensuring points are treated as numbers
      const redemptions = response.data.filter((txn) => Number(txn.points) < 0);
      setPointsHistory(redemptions);
    } catch (err: any) {
      console.error("Failed to fetch redemption history", err);
    } finally {
      setLoading(false);
    }
  };

  // Handlers for modals.
  const handleOpenHistoryModal = async () => {
    await fetchPointsHistory();
    setShowHistoryModal(true);
  };
  const handleCloseHistoryModal = () => setShowHistoryModal(false);
  const handleOpenRedeemModal = () => setShowRedeemOptions(true);
  const handleCloseRedeemModal = () => setShowRedeemOptions(false);
  const handleOpenEditProfile = () => setShowEditProfile(true);
  const handleCloseEditProfile = () => setShowEditProfile(false);

  const handleRedeemReward = async (reward: Reward) => {
    if (!user || user.loyalty_points_total < reward.cost_points) {
      alert("Insufficient points to redeem this item.");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      if (!token) return;
      // Call your backend redemption endpoint:
      await axios.post(
        `${API_BASE}/api/redeem`,
        { reward_id: reward.id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );
      // Update local user state by deducting points.
      const updatedUser = {
        ...user,
        loyalty_points_total: user.loyalty_points_total - reward.cost_points,
      };
      setUser(updatedUser);
      alert(`Redeemed ${reward.item} for ${reward.cost_points} points!`);
      // Refresh redemption history if necessary.
      await fetchPointsHistory();
      handleCloseRedeemModal();
    } catch (error) {
      alert("Redemption failed.");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen overflow-x-hidden">
      {/* Sidebar */}
      <div className="w-full lg:w-72 bg-white dark:bg-gray-800">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-5 bg-gray-100 dark:bg-gray-900 rounded-xl">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Spinner />
          </div>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : user ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="max-w-md mx-auto rounded-lg shadow-md bg-white dark:bg-gray-800">
              <CardHeader className="flex flex-col items-center p-4">
                {user.image ? (
                  <img
                    src={`${API_BASE}/profile_pictures/${user.image}`}
                    alt={user.name}
                    className="w-32 h-32 object-cover rounded-full"
                  />
                ) : (
                  <div className="w-32 h-32 flex items-center justify-center bg-gray-300 rounded-full">
                    <span className="text-gray-600">No Image</span>
                  </div>
                )}
                <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {user.name}
                </h2>
              </CardHeader>
              <CardBody className="p-4">
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Email:</strong> {user.email}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Contact Number:</strong> {user.contact_number}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Birthday:</strong> {formatBirthday(user.birthday)}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Address:</strong> {user.address}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Gender:</strong> {user.gender}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Role:</strong> {user.role}
                </p>
                <p className="text-gray-700 dark:text-gray-300 mb-2">
                  <strong>Loyalty Points:</strong> {user.loyalty_points_total}
                </p>
                <div className="mt-4 flex flex-col items-center">
                  <Button
                    variant="bordered"
                    color="secondary"
                    onPress={handleOpenHistoryModal}
                  >
                    View Redemption History
                  </Button>
                </div>
              </CardBody>
              <CardFooter className="p-4 flex justify-center gap-4">
                <Button
                  variant="solid"
                  color="primary"
                  onPress={handleOpenEditProfile}
                >
                  Edit Profile
                </Button>
                <Button
                  variant="solid"
                  color="secondary"
                  onPress={handleOpenRedeemModal}
                >
                  Redeem Points
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ) : null}
      </div>

      {/* Redemption History Modal */}
      <RedemptionHistoryModal
        isOpen={showHistoryModal}
        onClose={handleCloseHistoryModal}
        pointsHistory={pointsHistory}
      />

      {/* Redeem Points Modal */}
      <RedeemPointsModal
        isOpen={showRedeemOptions}
        onClose={handleCloseRedeemModal}
        onRedeem={handleRedeemReward}
      />

      {/* Edit Profile Modal */}
      {showEditProfile && user && (
        <EditProfileModal
          isOpen={showEditProfile}
          onClose={handleCloseEditProfile}
          user={user}
          onProfileUpdated={(updatedUser) => setUser(updatedUser)}
        />
      )}
    </div>
  );
}
