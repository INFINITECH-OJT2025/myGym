"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Home, User, Settings, Menu, X, LogOut } from "lucide-react";
import { Logo } from "@/components/icons";

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleLogout = () => {
        // Clear authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Redirect to login page
        router.push("/");
    };

    return (
        <div className="flex">
            {/* Hamburger Menu Button (Always Visible) */}
            <div className="fixed top-5 left-5 z-50">
                <Button variant="solid" color="primary" onPress={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
            </div>

            {/* Overlay (Click to Close) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-40"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            {/* Sidebar (Always Toggleable) */}
            <div className={`fixed top-0 left-0 h-full bg-blue-900 text-white w-64 z-50 flex flex-col transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-64"}`}>
                <div className="p-5 flex items-center justify-between">
                    <Logo />
                    <p className="font-bold text-inherit">ACME</p>
                    <Button variant="light" onPress={() => setIsOpen(false)}>
                        <X className="w-6 h-6" />
                    </Button>
                </div>
                
                <nav className="mt-5 space-y-2 flex-1">
                    <Button
                        variant="ghost"
                        className="w-full flex items-center justify-start gap-2 px-4 py-2 text-white hover:bg-gray-700"
                        onPress={() => { router.push("/user"); setIsOpen(false); }}
                    >
                        <Home className="w-5 h-5" /> Dashboard
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full flex items-center justify-start gap-2 px-4 py-2 text-white hover:bg-gray-700"
                        onPress={() => { router.push("/user/subs"); setIsOpen(false); }}
                    >
                        <User className="w-5 h-5" /> Subscription
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full flex items-center justify-start gap-2 px-4 py-2 text-white hover:bg-gray-700"
                        onPress={() => { router.push("/settings"); setIsOpen(false); }}
                    >
                        <Settings className="w-5 h-5" /> Settings
                    </Button>
                </nav>

                {/* Logout Button (Fixed at Bottom) */}
                <div className="p-5">
                    <Button
                        variant="solid"
                        color="danger"
                        className="w-full flex items-center justify-start gap-2 px-4 py-2 text-white"
                        onPress={handleLogout}
                    >
                        <LogOut className="w-5 h-5" /> Logout
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
