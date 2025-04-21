"use client";

import { ReactNode, useEffect, useState } from "react";
import { ToastProvider } from "@heroui/react";

const CustomToastProvider = ({ children }: { children: ReactNode }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const placement = isMobile ? "top-center" : "top-right";

  return (
    <ToastProvider
      placement={placement}
      containerStyle={{
        position: "absolute",
      }}
    >
      {children}
    </ToastProvider>
  );
};

export default CustomToastProvider;
