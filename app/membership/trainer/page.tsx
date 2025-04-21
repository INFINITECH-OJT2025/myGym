"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar_member";
import axios from "axios";
import { Card, CardHeader, CardBody, CardFooter, Button } from "@heroui/react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { CheckCircle } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// Define the PersonalTrainer interface as returned by the API.
interface PersonalTrainer {
  id: number;
  name: string;
  session: number;
  price: number;
  features: string;
  image: string;
  status: "show" | "hide";
}

// Define the Subscription (PaymentPersonal) interface.
// Note that we now expect the property to be called `personal_trainer` to match the API response.
interface Subscription {
  id: number;
  personal_trainer?: PersonalTrainer; // Changed from personalTrainer to personal_trainer.
  reference_number: string;
  transaction_date: string;
  image: string | null;
  status: "pending" | "completed" | "failed";
}

export default function MySubscriptionPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // On mount, fetch the authenticated user's completed subscriptions.
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        if (!token) {
          setError("User is not authenticated.");
          return;
        }
        // The endpoint returns only the completed subscriptions associated with the authenticated user.
        const response = await axios.get(`${API_BASE}/api/payments_personal/my_subscriptions`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (Array.isArray(response.data)) {
          setSubscriptions(response.data);
        } else {
          throw new Error("Invalid response format.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  const routerPushBrowse = () => {
    // Navigate to the page where the user can browse and subscribe to a personal trainer.
    router.push("/membership/personal");
  };

  // Render a card for the subscription.
  // Here we display details of the personal trainer the user subscribed to.
  const renderSubscriptionCard = (sub: Subscription) => {
    // Use the snake_case property from the response.
    const pt = sub.personal_trainer;
    if (!pt) {
      // Render fallback UI if related trainer data is missing.
      return (
        <motion.div
          key={sub.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="h-[460px] flex flex-col rounded-lg shadow-md bg-white dark:bg-gray-800">
            <CardHeader className="px-4 py-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                Subscription Data Unavailable
              </h2>
            </CardHeader>
            <CardBody className="px-4 py-2">
              <p className="text-gray-700 dark:text-gray-300">
                No trainer data was found for this subscription.
              </p>
            </CardBody>
          </Card>
        </motion.div>
      );
    }

    return (
      <motion.div
        key={sub.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="h-[460px] flex flex-col rounded-lg shadow-md bg-white dark:bg-gray-800">
          {pt.image && (
            <img
              src={pt.image}
              alt={pt.name}
              className="w-full h-48 object-cover rounded-t-lg"
            />
          )}
          <CardHeader className="px-4 py-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {pt.name}
            </h2>
          </CardHeader>
          <CardBody className="px-4 py-2 flex-1 overflow-hidden flex flex-col justify-center">
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Sessions Available: {pt.session}
            </p>
            <p className="text-gray-700 dark:text-gray-300 mb-2">
              Price: ₱{pt.price.toLocaleString()}
            </p>
            <div className="flex flex-col items-center justify-center text-gray-700 dark:text-gray-300">
              {pt.features &&
                pt.features.split(",").map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{feature.trim()}</span>
                  </div>
                ))}
            </div>
            {/* Session Usage - adjust the display logic if you track actual usage */}
            <p className="mt-4 text-gray-700 dark:text-gray-300">
              Session Usage: 0 / {pt.session}
            </p>
          </CardBody>
          <CardFooter className="px-4 py-2">
            <Button
              variant="solid"
              color="primary"
              className="w-full"
              onPress={() =>
                router.push(`/membership/subscription-details?id=${sub.id}`)
              }
            >
              View Subscription Details
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row overflow-x-hidden">
      <div className="w-full lg:w-72 bg-white dark:bg-gray-800">
        <Sidebar />
      </div>
      {/* Main Content */}
      <div className="flex-1 p-5 bg-gray-100 dark:bg-gray-900 rounded-xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          My Personal Trainer Subscription
        </h1>
        {loading ? (
          <p className="text-gray-500">Loading your subscription...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : subscriptions.length > 0 ? (
          subscriptions.map((sub) => renderSubscriptionCard(sub))
        ) : (
          <div className="text-center">
            <p className="text-gray-500">
              You haven't subscribed to any personal trainer yet.
            </p>
            <Button variant="solid" color="primary" onPress={routerPushBrowse}>
              Browse Personal Trainers
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
