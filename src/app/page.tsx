"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCookie } from "@/api/axios";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Check for token on client side
    const token = getCookie("token");

    if (token) {
      // If user is authenticated, redirect to the protected home page
      router.push("/dashboard");
    } else {
      // If no token, redirect to login
      router.push("/auth/login");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-lg">Redirecting...</div>
    </div>
  );
}
