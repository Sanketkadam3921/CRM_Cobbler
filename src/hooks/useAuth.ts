import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  const login = (email: string, password: string) => {
    const DEMO_EMAIL = "admin@cobbler.com";
    const DEMO_PASSWORD = "password123";

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userEmail", email);
      setIsAuthenticated(true);
      return { success: true, message: "Login successful!" };
    }
    return { success: false, message: "Invalid credentials. Please try again." };
  };

  const logout = () => {
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    setIsAuthenticated(false);
  };

  const signup = (email: string, password: string, name: string) => {
    localStorage.setItem("isAuthenticated", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userName", name);
    setIsAuthenticated(true);
    return { success: true, message: "Account created successfully!" };
  };

  return { isAuthenticated, login, logout, signup };
};