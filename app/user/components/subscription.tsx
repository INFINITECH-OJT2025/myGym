"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight, CheckCircle } from "lucide-react";
import axios from "axios";
import { useRouter } from "next/navigation";
import TriggerModal from "@/components/trigger_modal";

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
  const router = useRouter();
  
  // ✅ Initialize Embla Carousel (Shows 3, Moves 1 at a time)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1, // ✅ Moves ONE at a time
    draggable: true,
  });

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get("http://localhost:8000/api/subscriptions");
        if (Array.isArray(response.data)) {
          const visibleSubscriptions = response.data.filter(sub => sub.status === "show");
          setSubscriptions(visibleSubscriptions);
        } else {
          throw new Error("Invalid response format");
        }
      } catch (err: any) {
        console.error("Error fetching subscriptions:", err.message);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  // ✅ Update Active Index on Slide Change
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  // ✅ Carousel Navigation Functions
  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  return (
    <div className="flex flex-col items-center">
      <TriggerModal />

      {/* ✅ Join (Our Pricing) Section */}
      <section id="Join" className="py-16 px-4 w-full">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-black">Our Pricing</h2>
          <p className="text-gray-700 mt-4">Choose a plan that suits your needs.</p>
        </div>

        {/* ✅ Carousel Container */}
        <div className="relative w-full max-w-5xl mx-auto mt-10">
          {/* Left Navigation Button */}
          <button
            className="absolute left-[-2.5rem] top-1/2 transform -translate-y-1/2 p-3 bg-gray-800 text-white rounded-full shadow-md hover:bg-blue-700 transition hidden md:flex z-10"
            onClick={scrollPrev}
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* ✅ Subscription Plans Carousel (Shows 3, Moves 1) */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-6"> {/* ✅ No Overlapping */}
              {loading ? (
                <p className="text-center text-gray-500">Loading subscriptions...</p>
              ) : subscriptions.length > 0 ? (
                subscriptions.map((subscription) => (
                  <div key={subscription.id} className="flex-[0_0_33.333%] px-4"> {/* ✅ 3 at a time */}
                    <div className="bg-white p-8 rounded-lg shadow-lg w-full text-center border border-blue-500 h-[420px] flex flex-col justify-between">
                      <h3 className="text-2xl font-semibold text-black">{subscription.plan_name}</h3>
                      <p className="text-gray-600">Best for {subscription.duration} users</p>
                      <p className="text-3xl font-bold text-blue-500">₱{subscription.price}<span className="text-lg">/mo</span></p>

                      {/* ✅ Features List */}
                      <ul className="text-gray-600 space-y-2 flex-grow overflow-y-auto">
                        {subscription.features
                          ? subscription.features.split(",").map((feature, i) => (
                              <li key={i} className="text-black flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-500" />
                                {feature.trim()}
                              </li>
                            ))
                          : <li className="text-gray-500">No Features Available</li>
                        }
                      </ul>

                      {/* ✅ Subscribe Button */}
                      <button 
                        className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-black transition"
                        onClick={() => router.push(`/user/payment?plan=${subscription.id}`)}
                      >
                        Get Started
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">No subscriptions available.</p>
              )}
            </div>
          </div>

          {/* Right Navigation Button */}
          <button
            className="absolute right-[-2.5rem] top-1/2 transform -translate-y-1/2 p-3 bg-gray-800 text-white rounded-full shadow-md hover:bg-blue-700 transition hidden md:flex z-10"
            onClick={scrollNext}
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </section>
    </div>
  );
}
