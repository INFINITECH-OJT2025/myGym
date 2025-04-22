"use client";

import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";
import { title, subtitle } from "@/components/primitives";
import React, { useState } from "react";


export default function Home() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bmi, setBmi] = useState<string | null>(null);
  const [bmiCategory, setBmiCategory] = useState("");

  const calculateBMI = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const heightMeters = parseFloat(height) / 100;
    const weightKg = parseFloat(weight);
    if (heightMeters > 0 && weightKg > 0) {
      const bmiValue = (weightKg / (heightMeters * heightMeters)).toFixed(2);
      setBmi(bmiValue);
      if (parseFloat(bmiValue) < 18.5) setBmiCategory("Underweight");
      else if (parseFloat(bmiValue) < 24.9) setBmiCategory("Normal weight");
      else if (parseFloat(bmiValue) < 29.9) setBmiCategory("Overweight");
      else setBmiCategory("Obese");
    } else {
      setBmi(null);
      setBmiCategory("Invalid input");
    }
  };

  return (
    <section id="home" className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
      <div className="inline-block max-w-xl text-center justify-center">
        <span className={title()}>Make&nbsp;</span>
        <span className={title()}>beautiful&nbsp;</span>
        <br />
        <span className={title()}>
          websites regardless of your design experience.
        </span>
        <div className={subtitle({ class: "mt-4" })}>
          Beautiful, fast and modern React UI library.
        </div>
      </div>

      {/* Facility Section */}
      <section id="facilities" className="flex flex-col items-center justify-center gap-4 py-8 md:py-10">
        <div className="inline-block max-w-xl text-center">
          <span className={title()}>FACILITIES&nbsp;</span>
          <br />
          <div className={subtitle({ class: "mt-2 text-gray-700" })}>
            HOW IT FEELS TO BE WITH US
          </div>
          <div className={subtitle({ class: "mt-4 text-base text-gray-700" })}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit.
          </div>
        </div>
      </section>

      {/* BMI Calculator */}
      <section id="bmi" className="flex justify-center">
        <div className="max-w-3xl bg-white p-10 shadow-lg rounded-lg text-center">
          <span className={title()}>CALCULATE YOUR BMI</span>
          <div className={subtitle({ class: "mt-2 text-gray-700" })}>
            Enter your details to check your Body Mass Index
          </div>
          <form className="flex flex-col gap-4 mt-6" onSubmit={calculateBMI}>
            <input
              type="text"
              placeholder="Height (cm)"
              className="border p-3 rounded bg-gray-200 text-black"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
            />
            <input
              type="text"
              placeholder="Weight (kg)"
              className="border p-3 rounded bg-gray-200 text-black"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
            <button
              type="submit" 
              className={buttonStyles({ color: "primary", radius: "md", variant: "solid", class: "w-full mt-4" })}
            >
              CALCULATE BMI
            </button>
          </form>
          {bmi && (
            <div className="mt-4 text-black">
              <p>Your BMI is: <strong>{bmi}</strong></p>
              <p>Category: <strong>{bmiCategory}</strong></p>
            </div>
          )}
        </div>
      </section>
    

      {/* About Section */}
      <section id="about" className="py-16 text-center">
        <div className="inline-block max-w-3xl">
          <span className={title()}>About Us</span>
          <div className={subtitle({ class: "mt-4 text-gray-700" })}>
            We are a community-driven gym offering state-of-the-art equipment,
            certified trainers, and a motivating environment to help you reach your
            fitness goals.
          </div>
        </div>
      </section>

      {/* Join (Our Pricing) Section */}
      <section id='Join' className="bg- py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-Black-500">Our Pricing</h2>
          <p className="text-white mt-4">Choose a plan that suits your needs.</p>
        </div>
        <div className="flex flex-wrap justify-center mt-12 gap-6">
          {/* Basic Plan */}
          <div className="bg-white p-8 rounded-lg shadow-lg w-full sm:w-96 text-center border border-blue-500">
            <h3 className="text-2xl font-semibold text-black">Basic</h3>
            <p className="text-gray-600 mt-2">Great for individuals</p>
            <p className="text-3xl font-bold mt-4 text-blue-500">$9.99<span className="text-lg">/mo</span></p>
            <ul className="text-gray-600 mt-4 space-y-2">
              <li className="text-black">✔ Access to gym</li>
              <li className="text-black">✔ Free Wi-Fi</li>
              <li className="text-black">✔ Locker room access</li>
            </ul>
            <button  className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-black transition">Get Started</button>
          </div>
          
          {/* Standard Plan */}
          <div className="bg-white p-8 rounded-lg shadow-lg w-full sm:w-96 text-center border-2 border-blue-600">
            <h3 className="text-2xl font-semibold text-black">Standard</h3>
            <p className="text-gray-600 mt-2">Perfect for regulars</p>
            <p className="text-3xl font-bold mt-4 text-blue-500">$19.99<span className="text-lg">/mo</span></p>
            <ul className="text-gray-600 mt-4 space-y-2">
              <li className="text-black">✔ All Basic features</li>
              <li className="text-black">✔ Group classes</li>
              <li className="text-black">✔ Sauna access</li>
            </ul>
            <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-black transition">Get Started</button>
          </div>
          
          {/* Premium Plan */}
          <div className="bg-white p-8 rounded-lg shadow-lg w-full sm:w-96 text-center border border-blue-500">
            <h3 className="text-2xl font-semibold text-black">Premium</h3>
            <p className="text-gray-600 mt-2">Best for fitness enthusiasts</p>
            <p className="text-3xl font-bold mt-4 text-blue-500">$29.99<span className="text-lg">/mo</span></p>
            <ul className="text-gray-600 mt-4 space-y-2">
              <li className="text-black">✔ All Standard features</li>
              <li className="text-black">✔ Personal trainer</li>
              <li className="text-black">✔ Unlimited classes</li>
            </ul>
            <button className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-black transition">Get Started</button>
          </div>
        </div>
      </section>
    </section>
  );
}
