"use client";

import { Link } from "@heroui/link";
import { Snippet } from "@heroui/snippet";
import { Code } from "@heroui/code";
import { button as buttonStyles } from "@heroui/theme";
import { title, subtitle } from "@/components/primitives";
import React, { useState } from "react";
import { motion } from "framer-motion";
import TawkTo from "@/components/TawkTo";
import TriggerModal from "@/components/trigger_modal";


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
      <TriggerModal />
      <div className="inline-block max-w-xl text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl font-extrabold leading-tight uppercase tracking-wide"
        >
          <motion.span
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={title() + " text-red-600"}
          >
            Train&nbsp;
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={title() + " bg-gradient-to-r from-yellow-500 to-red-600 text-transparent bg-clip-text"}
          >
            Harder&nbsp;
          </motion.span>
          <br />
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className={title() + " text-gray-900"}
          >
            Build Strength. Crush Goals. <br />
            No Excuses.
          </motion.span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
          className={subtitle({ class: "mt-4 text-gray-600 text-lg font-semibold" })}
        >
          Your transformation starts now. Are you ready?
        </motion.p>
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

        

        <TawkTo /> {/* This will load Tawk.to on all pages */}
      </section>
    </section>

    
  );
}
