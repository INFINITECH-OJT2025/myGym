"use client";
import Sidebar from "@/components/sidebar";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SubscriptionPlan {
  id: number;
  name: string;
  price: number;
  features: string[];
}

const Subs = () => {
  const router = useRouter();
  const [user, setUser] = useState({
    name: "",
    email: "",
    contact: "",
    subscription: null as SubscriptionPlan | null,
  });
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user details including active subscription
  const fetchUser = async () => {
    try {
      const res = await fetch("http://localhost:8000/api/user", {
        credentials: "include",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });

      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);

      const data = await res.json();
      setUser({
        name: data.name,
        email: data.email,
        contact: data.contact,
        subscription: data.subscription || null,
      });
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  // Fetch subscription plans from the backend
  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8000/api/subscriptions");
      if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
      const data = await res.json();
      setPlans(data);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchPlans();
  }, []);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    console.log("Subscribing to plan:", plan);
  
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("No authentication token found!");
      return;
    }
  
    try {
      await fetch("http://localhost:8000/api/subscriptions", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ plan_id: plan.id }),
      });
  
      // ✅ Pass user credentials in the URL
      router.push(
        `/user/payment?plan_id=${plan.id}&plan_name=${encodeURIComponent(plan.name)}&price=${plan.price}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&contact=${encodeURIComponent(user.contact)}`
      );
    } catch (error) {
      console.error("Subscription request error:", error);
  
      // ✅ Always redirect to payment, even if there's an error
      router.push(
        `/user/payment?plan_id=${plan.id}&plan_name=${encodeURIComponent(plan.name)}&price=${plan.price}&name=${encodeURIComponent(user.name)}&email=${encodeURIComponent(user.email)}&contact=${encodeURIComponent(user.contact)}`
      );
    }
  };
  

  return (
    <div className="flex">
      <Sidebar />
      <section id="join" className="py-16 px-4 bg-white w-full">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-black">Our Pricing</h2>
          <p className="text-gray-600 mt-4">Choose a plan that suits your needs.</p>
        </div>

        {/* Subscription Plans */}
        <div className="flex flex-wrap justify-center mt-12 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white p-8 rounded-lg shadow-lg w-full sm:w-96 text-center border border-blue-500"
            >
              <h3 className="text-2xl font-semibold text-black">{plan.name}</h3>
              <p className="text-gray-600 mt-4 whitespace-pre-line">
                {plan.features.map((feature, idx) => `✔ ${feature}`).join("\n")}
              </p>
              <p className="text-3xl font-bold mt-4 text-blue-500">
              ₱{plan.price}<span className="text-lg">/mo</span>
              </p>

              {user.subscription?.id === plan.id ? (
                <p className="mt-4 text-green-600 font-bold">You are subscribed</p>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan)}
                  className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-black transition"
                >
                  Subscribe
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Subs;
