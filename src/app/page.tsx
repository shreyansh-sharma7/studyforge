import Image from "next/image";
import TimeTable from "@/app/modules/timetable/timetable";
import Calendar from "./modules/timetable/calendar";
import { createClient } from "@/lib/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.from("users").select("*");
  const userdata = await supabase.auth.getUser();
  console.log(userdata);
  return (
    <div className="h-full  text-primary">
      {}
      {/* <TimeTable></TimeTable>
      <Calendar></Calendar> */}
    </div>
  );
}
