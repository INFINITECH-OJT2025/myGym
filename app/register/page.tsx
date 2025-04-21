"use client";

import React, { useState } from "react";
import axios from "axios";
import { title, subtitle } from "@/components/primitives";
import { button as buttonStyles } from "@heroui/theme";
import { useRouter } from "next/navigation";
import { addToast } from "@heroui/react";

// Use an environment variable for API_BASE if defined.
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

// --- Helper validation functions (pure) ---
const getNameError = (value) => {
  if (!value.trim()) {
    return "You need a name to register.";
  } else if (value.trim().length < 6) {
    return "Name must be at least 6 characters.";
  }
  return "";
};

const getContactError = (value) => {
  if (!value.trim()) {
    return "You need a contact number to register.";
  } else if (!/^09\d{9}$/.test(value.trim())) {
    return "Contact number must start with 09 and be exactly 11 digits.";
  }
  return "";
};

const getEmailError = (value) => {
  if (!value.trim()) {
    return "You need an email to register.";
  }
  return "";
};

const getBirthdayError = (value) => {
  if (!value.trim()) {
    return "You need a birthday to register.";
  }
  return "";
};

const getAddressError = (value) => {
  if (!value.trim()) {
    return "You need an address to register.";
  }
  return "";
};

const getPasswordError = (value) => {
  if (!value) {
    return "You need a password to register.";
  } else if (value.length < 6) {
    return "Password must be at least 6 characters.";
  } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    return "Password must contain at least one special character.";
  }
  return "";
};

const getConfirmPasswordError = (value, password) => {
  if (!value) {
    return "You need to confirm your password.";
  } else if (value !== password) {
    return "Passwords do not match.";
  }
  return "";
};

const Register = () => {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact_number, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Inline validation error state variables
  const [nameError, setNameError] = useState("");
  const [contactError, setContactError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [birthdayError, setBirthdayError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  // --- Handlers for onChange that update both value and error ---
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    setNameError(getNameError(val));
  };

  const handleContactChange = (e) => {
    const val = e.target.value;
    setContact(val);
    setContactError(getContactError(val));
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    setEmailError(getEmailError(val));
  };

  const handleBirthdayChange = (e) => {
    const val = e.target.value;
    setBirthday(val);
    setBirthdayError(getBirthdayError(val));
  };

  const handleAddressChange = (e) => {
    const val = e.target.value;
    setAddress(val);
    setAddressError(getAddressError(val));
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setPasswordError(getPasswordError(val));
    setConfirmPasswordError(getConfirmPasswordError(confirmPassword, val));
  };

  const handleConfirmPasswordChange = (e) => {
    const val = e.target.value;
    setConfirmPassword(val);
    setConfirmPasswordError(getConfirmPasswordError(val, password));
  };

  // Validate the entire form and update inline errors
  const validateForm = () => {
    const errors = {
      name: getNameError(name),
      contact: getContactError(contact_number),
      email: getEmailError(email),
      birthday: getBirthdayError(birthday),
      address: getAddressError(address),
      password: getPasswordError(password),
      confirmPassword: getConfirmPasswordError(confirmPassword, password),
    };

    setNameError(errors.name);
    setContactError(errors.contact);
    setEmailError(errors.email);
    setBirthdayError(errors.birthday);
    setAddressError(errors.address);
    setPasswordError(errors.password);
    setConfirmPasswordError(errors.confirmPassword);

    return Object.values(errors).every((msg) => msg === "");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) {
      if (nameError) {
        addToast({
          title: "Registration Failed",
          description: nameError,
          color: "danger",
          variant: "flat",
          radius: "full",
          timeout: 4000,
          hideIcon: true,
          classNames: { closeButton: "show" },
        });
      }
      if (contactError) {
        addToast({
          title: "Registration Failed",
          description: contactError,
          color: "danger",
          variant: "flat",
          radius: "full",
          timeout: 4000,
          hideIcon: true,
          classNames: { closeButton: "show" },
        });
      }
      if (emailError) {
        addToast({
          title: "Registration Failed",
          description: emailError,
          color: "danger",
          variant: "flat",
          radius: "full",
          timeout: 4000,
          hideIcon: true,
          classNames: { closeButton: "show" },
        });
      }
      if (birthdayError) {
        addToast({
          title: "Registration Failed",
          description: birthdayError,
          color: "danger",
          variant: "flat",
          radius: "full",
          timeout: 4000,
          hideIcon: true,
          classNames: { closeButton: "show" },
        });
      }
      if (addressError) {
        addToast({
          title: "Registration Failed",
          description: addressError,
          color: "danger",
          variant: "flat",
          radius: "full",
          timeout: 4000,
          hideIcon: true,
          classNames: { closeButton: "show" },
        });
      }
      if (passwordError) {
        addToast({
          title: "Registration Failed",
          description: passwordError,
          color: "danger",
          variant: "flat",
          radius: "full",
          timeout: 4000,
          hideIcon: true,
          classNames: { closeButton: "show" },
        });
      }
      if (confirmPasswordError) {
        addToast({
          title: "Registration Failed",
          description: confirmPasswordError,
          color: "danger",
          variant: "flat",
          radius: "full",
          timeout: 4000,
          hideIcon: true,
          classNames: { closeButton: "show" },
        });
      }
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const headers = token
        ? {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
            "Content-Type": "application/json",
          }
        : {
            Accept: "application/json",
            "Content-Type": "application/json",
          };

      const response = await axios.post(
        `${API_BASE}/api/register`,
        {
          name,
          email,
          contact_number,
          birthday,
          address,
          gender,
          password,
          password_confirmation: confirmPassword,
        },
        { headers }
      );

      console.log("User registered:", response.data);
      addToast({
        title: "Registration Successful",
        description: "Registration successful! Redirecting to login...",
        color: "success",
        variant: "flat",
        radius: "full",
        timeout: 4000,
        hideIcon: true,
        classNames: { closeButton: "show" },
      });
      router.push("/login");
    } catch (err: any) {
      console.error("Registration error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-[600px]">
        <div className="text-center">
          <span className={title({ color: "blue" })}>Register</span>
          <div className={subtitle({ class: "mt-2 text-gray-600" })}>
            Create your account to get started
          </div>
        </div>

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}

        <form onSubmit={handleSubmit} className="grid grid-cols-6 gap-6 mt-6">
          {/* Left Side */}
          <div className="col-span-3 grid gap-4">
            <div>
              <label className="block text-gray-600 text-sm mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                className={`w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  nameError ? "border-red-500" : ""
                }`}
                placeholder="Enter your full name"
              />
              {nameError && <p className="text-red-500 text-sm">{nameError}</p>}
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-2">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-2">Birthday</label>
              <input
                type="date"
                value={birthday}
                onChange={handleBirthdayChange}
                className={`w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  birthdayError ? "border-red-500" : ""
                }`}
              />
              {birthdayError && <p className="text-red-500 text-sm">{birthdayError}</p>}
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-2">Address</label>
              <input
                type="text"
                value={address}
                onChange={handleAddressChange}
                placeholder="Address"
                className={`w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  addressError ? "border-red-500" : ""
                }`}
              />
              {addressError && <p className="text-red-500 text-sm">{addressError}</p>}
            </div>
          </div>

          {/* Right Side */}
          <div className="col-span-3 grid gap-4">
            <div>
              <label className="block text-gray-600 text-sm mb-2">Contact Number</label>
              <input
                type="text"
                value={contact_number}
                onChange={handleContactChange}
                className={`w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 ${
                  contactError ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-400"
                }`}
                placeholder="Enter your contact number"
              />
              {contactError && <p className="text-red-500 text-sm">{contactError}</p>}
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={handleEmailChange}
                className={`w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 ${
                  emailError ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-400"
                }`}
                placeholder="Enter your email"
              />
              {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-2">Password</label>
              <input
                type="text" // always visible as requested
                value={password}
                onChange={handlePasswordChange}
                className={`w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 ${
                  passwordError ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-400"
                }`}
                placeholder="Enter your password"
              />
              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-2">Confirm Password</label>
              <input
                type="text" // always visible as requested
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                className={`w-full px-4 py-2 border rounded-lg text-black focus:outline-none focus:ring-2 ${
                  confirmPasswordError ? "border-red-500 focus:ring-red-500" : "focus:ring-blue-400"
                }`}
                placeholder="Confirm your password"
              />
              {confirmPasswordError && <p className="text-red-500 text-sm">{confirmPasswordError}</p>}
            </div>
          </div>

          {/* Submit Button */}
          <div className="col-span-6">
            <button
              type="submit"
              className={buttonStyles({
                color: loading ? "default" : "primary",
                radius: "md",
                variant: "solid",
                class: "w-full mt-4",
              })}
              disabled={loading}
            >
              {loading ? "Registering..." : "Register"}
            </button>
          </div>
        </form>

        <p className="text-center text-gray-600 text-sm mt-4">
          Already have an account?{" "}
          <a href="/login" className="text-blue-500 hover:underline">
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
