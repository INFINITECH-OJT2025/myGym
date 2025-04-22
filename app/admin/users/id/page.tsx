"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const UpdateUser = ({ params }: { params: { id: string } }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://127.0.0.1:8000/api/users/${params.id}`);
        setUser(response.data);
      } catch (err) {
        setError("Error fetching user");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.put(`http://127.0.0.1:8000/api/users/${params.id}`, user, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });
      alert("User updated successfully!");
      router.push("/admin/users");
    } catch (err) {
      setError("Error updating user");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold">Update User</h2>
      {error && <p className="text-red-500">{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name</label>
          <input
            type="text"
            value={user?.name || ""}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
          />
        </div>
        <div>
          <label>Email</label>
          <input
            type="email"
            value={user?.email || ""}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
          />
        </div>
        <div>
          <label>Contact Number</label>
          <input
            type="text"
            value={user?.contact_number || ""}
            onChange={(e) => setUser({ ...user, contact_number: e.target.value })}
          />
        </div>
        <button type="submit" disabled={loading}>Update</button>
      </form>
    </div>
  );
};

export default UpdateUser;
