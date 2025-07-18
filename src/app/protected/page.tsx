// app/protected/page.tsx or wherever your route is

import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import ProtectedPageClient from "@/components/auth/protected-page";

export default async function ProtectedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Fetch user's display name from the 'users' table
  const { data, error } = await supabase
    .from("users")
    .select("metadata")
    .eq("id", user.id)
    .single();

  // If error fetching profile, you may also want to redirect or handle gracefully
  if (error || !data) {
    console.warn(error);
    redirect("/auth/login");
  }

  return <ProtectedPageClient displayName={data.metadata.display_name} />;
}
