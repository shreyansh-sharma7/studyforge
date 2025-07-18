"use client";

import { createClient } from "@/lib/client";
import { Button } from "@/components/auth/ui/button";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();

    localStorage.removeItem("displayName");
    localStorage.setItem("signed_in", "false");

    router.push("/auth/login");
  };

  return <Button onClick={logout}>Logout</Button>;
}
