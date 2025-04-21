"use client";

import Sidebar from "@/components/sidebar";
import { useState, useEffect } from "react";
import { CheckCircle, Clock } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardBody } from "@heroui/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import { motion } from "framer-motion";
import { useMediaQuery } from "react-responsive";

import "swiper/css";
import "swiper/css/autoplay";

interface Subscription {
  id: number;
  plan_name: string;
  price: number;
  duration: string;
  features: string;
  status: string;
}

export default function Subscription() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const router = useRouter();
  // Inside your component
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });

  const slidesPerView = isMobile ? 1 : isTablet ? 2 : 3;
  

  // ✅ Highlight this plan as "Best Value"
  const bestValuePlanId = 1;

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get(
          "http://localhost:8000/api/subscriptions"
        );
        if (Array.isArray(response.data)) {
          setSubscriptions(
            response.data.filter((sub) => sub.status === "show")
          );
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, []);

  const pageCount = Math.ceil(subscriptions.length / slidesPerView);
  const activePage = Math.floor(activeIndex / slidesPerView);

  return (
    <div className="flex overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 p-6 transition-all duration-300 w-full md:ml-[250px] lg:ml-[280px] bg-gray-100 dark:bg-gray-900 rounded-xl overflow-x-hidden">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Subscription Plans
          </h1>
        </div>

        <Swiper
          spaceBetween={20}
          slidesPerView={1}
          autoplay={{
            delay: 10000,
            disableOnInteraction: false,
          }}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
          modules={[Autoplay]}
          breakpoints={{
            480: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 3 },
          }}
          className="mySwiper"
        >
          {loading ? (
            <p className="text-gray-500">Loading subscriptions...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : subscriptions.length > 0 ? (
            subscriptions.map((subscription, index) => (
              <SwiperSlide key={subscription.id}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="h-full"
                >
                  <Card className="relative h-[460px] flex flex-col justify-between bg-white dark:bg-gray-800 rounded-lg shadow-md transform transition-all duration-300 hover:scale-[1.03] hover:shadow-xl">
                    {/* BEST VALUE Badge */}
                    {subscription.id === bestValuePlanId && (
                      <div className="absolute top-2 right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded shadow-md text-black">
                        ⭐ Best Value
                      </div>
                    )}

                    {/* Header */}
                    <CardHeader className="pb-0 pt-4 px-4 flex-col items-start">
                      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm font-semibold uppercase">
                        <Clock className="w-4 h-4" />
                        {subscription.duration || "N/A"}
                      </div>
                      <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">
                        {subscription.plan_name}
                      </h4>
                    </CardHeader>

                    {/* Features */}
                    <div className="flex-1 flex items-center justify-center px-4">
                      {subscription.features ? (
                        <ul className="space-y-2 max-h-32 overflow-y-auto">
                          {subscription.features
                            .split(",")
                            .map((feature, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-2 text-gray-700 dark:text-gray-300"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                <span>{feature.trim()}</span>
                              </li>
                            ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 dark:text-gray-400">
                          No Features Available
                        </p>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 pt-2 pb-4">
                      <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        ₱ {subscription.price.toLocaleString()}
                      </p>
                      <button
                        onClick={() =>
                          router.push(`/user/payment?plan=${subscription.id}`)
                        }
                        className="w-full mt-2 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition dark:bg-blue-700 dark:hover:bg-blue-800"
                      >
                        Subscribe Now
                      </button>
                    </div>
                  </Card>
                </motion.div>
              </SwiperSlide>
            ))
          ) : (
            <p className="text-center py-6 text-gray-500 dark:text-gray-400">
              No subscriptions found.
            </p>
          )}
        </Swiper>

        {subscriptions.length > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            {[...Array(pageCount)].map((_, index) => (
              <motion.div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === activePage
                    ? "bg-blue-600 dark:bg-blue-400 scale-125"
                    : "bg-gray-400 dark:bg-gray-600"
                }`}
                transition={{ duration: 0.3 }}
                animate={{
                  scale: index === activePage ? 1.25 : 1,
                  opacity: index === activePage ? 1 : 0.6,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
