'use client';

import { useEffect, useState } from "react";
import { Toaster } from "sonner";

const MOBILE_BREAKPOINT = 640;

export function AppToaster() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const updatePosition = () => {
      setIsMobile(mediaQuery.matches);
    };

    updatePosition();
    mediaQuery.addEventListener("change", updatePosition);

    return () => {
      mediaQuery.removeEventListener("change", updatePosition);
    };
  }, []);

  return (
    <Toaster
      position={isMobile ? "top-center" : "bottom-right"}
      richColors
      theme="system"
      toastOptions={{
        classNames: {
          toast: "rounded-xl border border-gray-200 shadow-lg",
        },
      }}
    />
  );
}
