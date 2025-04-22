"use client";

import React, { useEffect, useState } from "react";
import Sidebar from "@/components/sidebar_admin";
import axiosInstance from "@/app/utils/axiosInstance"; // ✅ Import axios instance

interface User {
  id: number;
  name: string;
  email: string;
  contact_number: string;
  role: string;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
        try {
            // ✅ Get CSRF cookie first
            await axiosInstance.get("/sanctum/csrf-cookie");
            
            // ✅ Now fetch users
            const response = await axiosInstance.get<User[]>("/users");
            setUsers(response.data);
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to fetch users.");
        } finally {
            setLoading(false);
        }
    };

    fetchUsers();
  }, []);

  return (
    <div className="p-6">
      <Sidebar />
      <h1 className="text-2xl font-bold">User Management</h1>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {loading ? <p>Loading users...</p> : (
        <table className="w-full mt-6 border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2">ID</th>
              <th className="border p-2">Name</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Contact</th>
              <th className="border p-2">Role</th>
              <th className="border p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border">
                <td className="border p-2">{user.id}</td>
                <td className="border p-2">{user.name}</td>
                <td className="border p-2">{user.email}</td>
                <td className="border p-2">{user.contact_number}</td>
                <td className="border p-2 font-semibold">
                  <span className={user.role === "admin" ? "text-red-500" : "text-blue-500"}>
                    {user.role.toUpperCase()}
                  </span>
                </td>
                <td className="border p-2">
                  <button className="bg-blue-500 text-white px-3 py-1 rounded mr-2">
                    Edit
                  </button>
                  <button className="bg-red-500 text-white px-3 py-1 rounded">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminUsersPage;
