"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { addToast, Button } from "@heroui/react"; // Import the Button component
import { title, subtitle } from "@/components/primitives";

// ✅ Define API Response Type
interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    membership_status: "pending" | "active" | "expired" | "canceled";
  };
}

const API_BASE = "http://127.0.0.1:8000";

const Login = () => {
  const [isClient, setIsClient] = useState(false); // Prevent SSR mismatches
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Ensure hydration completes before rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE}/api/login`, {
        email,
        password,
      });
      const { token, user } = response.data as LoginResponse;

      console.log("✅ API Response:", response.data);
      console.log("✅ User Role:", user.role);
      console.log("✅ Membership Status:", user.membership_status);

      // Save token and user info in local storage
      if (isClient) {
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(user));
        console.log("✅ Stored Token:", localStorage.getItem("token"));
      }

      addToast({
        title: "Login Successful",
        description: `Welcome back, ${user.name}!`,
        color: "success",
        variant: "flat",
        radius: "full",
        timeout: 2000,
        hideIcon: true,
        classNames: {
          closeButton: "show",
        },
      });

      // Redirect Based on Role and Membership Status
      let redirectPath = "/user"; // Default path for members

      if (user.role === "admin") {
        redirectPath = "/admin";
      } else if (user.role === "member") {
        if (user.membership_status === "pending") {
          redirectPath = "/membership";
        } else if (user.membership_status === "active") {
          redirectPath = "/membership/active";
        } else if (user.membership_status === "expired") {
          redirectPath = "/membership/expired";
        }
      }

      console.log("✅ Redirecting to:", redirectPath);
      setTimeout(() => {
        router.replace(redirectPath);
      }, 500);
    } catch (err) {
      

      setError("Invalid credentials.");

      // Add error toast if login fails (e.g., wrong email or password)
      addToast({
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
        color: "danger",
        variant: "flat",
        radius: "full",
        timeout: 2000,
        hideIcon: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration mismatch by rendering only after hydration
  if (!isClient) return null;

  return (
    <div className="flex items-center justify-center">
      <div className="relative bg-white p-8 rounded-2xl shadow-lg w-96 bg-opacity-90">
        <div className="text-center">
          <span className={title()} suppressHydrationWarning={true}>
            Login
          </span>
          <div
            className={subtitle({ class: "mt-2 text-gray-600" })}
            suppressHydrationWarning={true}
          >
            Sign in to access your account
          </div>
        </div>

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}

        <form className="space-y-4 mt-6" onSubmit={handleLogin}>
          <div>
            <label className="block text-gray-600 text-sm mb-2">Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="block text-gray-600 text-sm mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Using the Button component with the loading prop */}
          <Button
            type="submit"
            isLoading={loading}
            color="primary"
            radius="md"
            variant="solid"
            className="w-full mt-4"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </Button>
        </form>

        <p className="text-center text-gray-600 text-sm mt-4">
          Don't have an account?{" "}
          <a href="/register" className="text-blue-500 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default Login;
