"use client";

import { useEffect, useState } from "react";

export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    location.href = "/"; // recarga landing
  };

  return { isAuthenticated, logout };
}