"use client";
import { useEffect } from "react";

const TawkTo = () => {
  useEffect(() => {
    const script = document.createElement("script");
    script.async = true;
    script.src = "https://embed.tawk.to/67d6e3edb2e07b190a5fa249/1imfmr0qg";
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null; // No UI needed, just injects the script
};

export default TawkTo;