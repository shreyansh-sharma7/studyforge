import Image from "next/image";
import TimeTable from "@/app/modules/timetable/timetable";
import Calendar from "./modules/timetable/calendar";
import { createClient } from "@/lib/server";
import { redirect } from "next/navigation";

export default async function Home() {
  redirect("/files");
  return <div className="h-full  text-primary"></div>;
}
