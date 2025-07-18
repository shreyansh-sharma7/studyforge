"use client";

import { useEffect } from "react";
import { LogoutButton } from "@/components/auth/logout-button";

export default function ProtectedPageClient({
  displayName,
}: {
  displayName: string;
}) {
  useEffect(() => {
    if (displayName) {
      localStorage.setItem("displayName", displayName);
    }
  }, [displayName]);

  return (
    <div className="flex h-svh w-full items-center justify-center gap-2">
      <p>
        Hello <span>{displayName}</span>
      </p>
      <LogoutButton />
    </div>
  );
}
