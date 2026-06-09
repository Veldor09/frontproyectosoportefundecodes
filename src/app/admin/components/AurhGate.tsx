"use client";

import { useEffect } from "react";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      location.href = "/landing"; // fuerza salida inmediata
    }
  }, []);

  return <>{children}</>;
}