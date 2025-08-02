import Image from "next/image";
import TimeTable from "@/app/modules/timetable/timetable";
import Calendar from "./modules/timetable/calendar";
import { createClient } from "@/lib/server";
import { Peek } from "@/components/ui/peek";

export default async function Home() {
  return (
    <div className="h-full  text-primary">
      {}
      {/* <TimeTable></TimeTable>
      <Calendar></Calendar> */}
    </div>
  );
}
