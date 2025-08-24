"use client";

import { useEffect } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { redirect } from "next/navigation";

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

  // redirect("/files/setup");

  return (
    <div className="flex h-svh w-full items-center justify-center gap-2">
      <p>
        Hello <span>{displayName}</span>
      </p>
      <LogoutButton />
    </div>
  );
}
