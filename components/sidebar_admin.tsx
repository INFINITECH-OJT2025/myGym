"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/button";
import { Home, User, Settings, Menu, X, LogOut, ChevronDown, ChevronUp, Briefcase } from "lucide-react";

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isManagementOpen, setIsManagementOpen] = useState(false);
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
    };

    return (
        <div className="flex">
            {/* Hamburger Menu Button */}
            <div className="fixed top-5 left-5 z-50">
                <Button variant="solid" color="primary" onPress={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </Button>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black opacity-50 z-40"
                    onClick={() => setIsOpen(false)}
                ></div>
            )}

            {/* Sidebar */}
            <div className={`fixed top-0 left-0 h-full bg-blue-900 text-white w-64 z-50 flex flex-col transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-64"}`}>
                <div className="p-5 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Admin</h2>
                    <Button variant="light" onPress={() => setIsOpen(false)}>
                        <X className="w-6 h-6" />
                    </Button>
                </div>
                
                
                <nav className="mt-5 space-y-2 flex-1">

                  {/* Management Button with Dropdown */}
                  <div className="relative">
                        <Button
                            variant="ghost"
                            className="w-full flex items-center justify-between px-4 py-2 text-white hover:bg-gray-700"
                            onPress={() => setIsManagementOpen(!isManagementOpen)}
                        >
                            <span className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5" /> Management
                            </span>
                            {isManagementOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </Button>
                        {isManagementOpen && (
                            <div className="ml-6 mt-1 space-y-2">
                                <Button
                                    variant="ghost"
                                    className="w-full flex items-center justify-start px-4 py-2 text-white hover:bg-gray-700"
                                    onPress={() => { router.push("/admin/users"); setIsOpen(false); }}
                                >
                                    Users
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full flex items-center justify-start px-4 py-2 text-white hover:bg-gray-700"
                                    onPress={() => { router.push("/management/coaches"); setIsOpen(false); }}
                                >
                                    Coaches
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full flex items-center justify-start px-4 py-2 text-white hover:bg-gray-700"
                                    onPress={() => { router.push("/admin/subscription"); setIsOpen(false); }}
                                >
                                    Subscription
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full flex items-center justify-start px-4 py-2 text-white hover:bg-gray-700"
                                    onPress={() => { router.push("/admin/paid"); setIsOpen(false); }}
                                >
                                    Paid
                                </Button>
                                <Button
                                    variant="ghost"
                                    className="w-full flex items-center justify-start px-4 py-2 text-white hover:bg-gray-700"
                                    onPress={() => { router.push("/management/location"); setIsOpen(false); }}
                                >
                                    Location
                                </Button>
                            </div>
                        )}
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full flex items-center justify-start gap-2 px-4 py-2 text-white hover:bg-gray-700"
                        onPress={() => { router.push("/dashboard"); setIsOpen(false); }}
                    >
                        <Home className="w-5 h-5" /> Dashboard
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full flex items-center justify-start gap-2 px-4 py-2 text-white hover:bg-gray-700"
                        onPress={() => { router.push("/profile"); setIsOpen(false); }}
                    >
                        <User className="w-5 h-5" /> Profile
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full flex items-center justify-start gap-2 px-4 py-2 text-white hover:bg-gray-700"
                        onPress={() => { router.push("/settings"); setIsOpen(false); }}
                    >
                        <Settings className="w-5 h-5" /> Settings
                    </Button>

                    
                </nav>

                {/* Logout Button */}
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
