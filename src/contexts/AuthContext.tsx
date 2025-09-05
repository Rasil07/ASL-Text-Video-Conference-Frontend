"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { verifyToken } from "@/api/auth";

import browserCookie from "@/lib/cookie";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  verifyAuth: () => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const verifyAuth = async (): Promise<boolean> => {
    try {
      const token = browserCookie.getBrowserToken();
      if (!token) {
        setIsAuthenticated(false);

        return false;
      }

      // Verify token with API server
      const response = await verifyToken();

      console.log("Verify token ==>", { response });
      if (response.success) {
        setIsAuthenticated(true);
        return true;
      } else {
        // Token is invalid, clear it
        browserCookie.removeBrowserToken();
        browserCookie.removeBrowserUser();
        setIsAuthenticated(false);

        return false;
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      // Token verification failed, clear invalid tokens
      browserCookie.removeBrowserToken();
      browserCookie.removeBrowserUser();
      setIsAuthenticated(false);

      return false;
    }
  };

  const logout = () => {
    browserCookie.removeBrowserToken();
    browserCookie.removeBrowserUser();
    setIsAuthenticated(false);
  };

  useEffect(() => {
    // Mark as mounted first
    setIsMounted(true);

    // Then verify auth
    const initAuth = async () => {
      await verifyAuth();
      setIsLoading(false);
    };

    initAuth();
  }, []);

  // Don't render children until mounted to prevent hydration mismatch
  if (!isMounted) {
    return (
      <AuthContext.Provider
        value={{
          isAuthenticated: false,
          isLoading: true,
          verifyAuth,
          logout,
        }}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      </AuthContext.Provider>
    );
  }

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    verifyAuth,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
