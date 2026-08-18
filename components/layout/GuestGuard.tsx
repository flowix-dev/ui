"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthCheck } from "@/lib/hooks";

export default function GuestGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, initialized, loading } = useAuthCheck();

  useEffect(() => {
    if (initialized && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [initialized, isAuthenticated, router]);

  if ((!initialized || loading) && !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isAuthenticated) return null;

  return <>{children}</>;
}
