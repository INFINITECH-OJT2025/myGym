"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/sidebar_member";
import axios from "axios";
import { Card, CardHeader, CardBody, CardFooter, Button } from "@heroui/react";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import { CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "@heroui/react";
import "swiper/css";
import "swiper/css/pagination";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

interface PersonalTrainer {
  id: number;
  name: string;
  session: number;
  price: number;
  features: string;
  image: string;
  status: "show" | "hide";
}

export default function PersonalTrainersPage() {
  const [personalTrainers, setPersonalTrainers] = useState<PersonalTrainer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Detect mobile screens via media query hook.
  const isMobile = useMediaQuery({ maxWidth: 767 });

  useEffect(() => {
    const fetchPersonalTrainers = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("token");
        // Use backticks to create a template literal for the API endpoint.
        const response = await axios.get(`${API_BASE}/api/personal_trainers`, {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
            Accept: "application/json",
          },
        });
        if (Array.isArray(response.data)) {
          setPersonalTrainers(
            response.data.filter((pt: PersonalTrainer) => pt.status === "show")
          );
        } else {
          throw new Error("Invalid response format.");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPersonalTrainers();
  }, []);

  const renderCard = (pt: PersonalTrainer) => (
    <motion.div
      key={pt.id}
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
            Sessions: {pt.session}
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
        </CardBody>
        <CardFooter className="px-4 py-2">
          <Button
            variant="solid"
            color="primary"
            className="w-full"
            onPress={() =>
              router.push(`/membership/payment?personalTrainerId=${pt.id}`)
            }
          >
            Have a Personal Trainer Now
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );

  return (
    <div className="flex flex-col lg:flex-row overflow-x-hidden">
      {/* Sidebar: full width on mobile, fixed width on desktop */}
      <div className="w-full lg:w-72 bg-white dark:bg-gray-800">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-5 bg-gray-100 dark:bg-gray-900 rounded-xl">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Personal Trainers
        </h1>

        {loading ? (
          <p className="text-gray-500">Loading personal trainers...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : personalTrainers.length > 0 ? (
          isMobile ? (
            <Swiper
              spaceBetween={20}
              slidesPerView={1}
              pagination={{ clickable: true }}
              modules={[Pagination]}
            >
              {personalTrainers.map((pt) => (
                <SwiperSlide key={pt.id}>{renderCard(pt)}</SwiperSlide>
              ))}
            </Swiper>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {personalTrainers.map((pt) => renderCard(pt))}
            </div>
          )
        ) : (
          <p className="text-center py-6 text-gray-500 dark:text-gray-400">
            No personal trainers found.
          </p>
        )}
      </div>
    </div>
  );
}
