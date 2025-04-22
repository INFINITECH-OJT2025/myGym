"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { title, subtitle } from "@/components/primitives";
import { button as buttonStyles } from "@heroui/theme";

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        try {
            console.log("Submitting login request...");
            const response = await axios.post("http://127.0.0.1:8000/api/login", {
                email,
                password
            });

            // ✅ Explicitly define the response type
            const { token, user } = response.data as { token: string; user: { role: string } };

            console.log("Login successful:", response.data);

            // ✅ Save token and user role to localStorage
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(user));

            // ✅ Redirect based on user role
            if (user.role === "admin") {
                router.push("/admin"); // Redirect admin users
            } else {
                router.push("/user"); // Redirect regular users
            }
        } catch (err: any) {
            console.error("Login error:", err.response?.data || err.message);
            setError(err.response?.data?.message || "Invalid credentials. Please try again.");
        }
    };

    return (
        <div className="flex items-center justify-center ">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-96">
                <div className="text-center">
                    <span className={title()}>Login</span>
                    <div className={subtitle({ class: "mt-2 text-gray-600" })}>
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

                    <button
                        type="submit"
                        className={buttonStyles({
                            color: "primary",
                            radius: "md",
                            variant: "solid",
                            class: "w-full mt-4",
                        })}
                    >
                        Login
                    </button>
                </form>

                <p className="text-center text-gray-600 text-sm mt-4">
                    Don't have an account?{" "}
                    <a href="/register" className="text-blue-500 hover:underline">Sign up</a>
                </p>
            </div>
        </div>
    );
};

export default Login;