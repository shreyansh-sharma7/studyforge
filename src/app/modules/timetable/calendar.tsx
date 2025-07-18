const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const events = [
  {
    title: "Math Revision",
    dayIndex: 0, // Monday
    start: "09:45",
    end: "10:15",
  },
  {
    title: "Chemistry",
    dayIndex: 2, // Wednesday
    start: "14:00",
    end: "15:30",
  },
];

export default function Calendar() {
  const startHour = 9;
  const endHour = 24;
  const interval = 15; // minutes
  const pxPerInterval = 12; // 12px = 15min
  const totalSlots = ((endHour - startHour) * 60) / interval;

  const timeToOffset = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m - startHour * 60;
  };

  return (
    <div className="flex flex-col text-white bg-black">
      {/* Header Row */}
      <div className="flex sticky top-0 z-10 bg-black">
        <div className="w-16" /> {/* Empty top-left cell */}
        {days.map((day, i) => (
          <div
            key={i}
            className="flex-1 text-center py-2 border border-blue-700 text-blue-300 font-medium text-sm"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Time column */}
        <div className="flex flex-col text-right text-xs text-blue-400 pr-2">
          {Array.from({ length: totalSlots }).map((_, i) => {
            const minutes = i * interval;
            const hour = Math.floor((startHour * 60 + minutes) / 60);
            const min = (startHour * 60 + minutes) % 60;
            return (
              <div key={i} className="h-[12px]">
                {min === 0 ? `${hour}:00` : ""}
              </div>
            );
          })}
        </div>

        {/* Calendar Grid */}
        <div className="flex flex-1 relative">
          {days.map((_, dayIdx) => (
            <div
              key={dayIdx}
              className="flex-1 border-l border-blue-800 relative"
            >
              {/* Background grid */}
              {Array.from({ length: totalSlots }).map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-b border-blue-900"
                  style={{ top: `${i * pxPerInterval}px`, height: "0px" }}
                />
              ))}

              {/* Events for this day */}
              {events
                .filter((e) => e.dayIndex === dayIdx)
                .map((event, i) => {
                  const top =
                    (timeToOffset(event.start) / interval) * pxPerInterval;
                  const height =
                    ((timeToOffset(event.end) - timeToOffset(event.start)) /
                      interval) *
                    pxPerInterval;

                  return (
                    <div
                      key={i}
                      className="absolute left-1 right-1 bg-blue-600 rounded text-xs px-1 py-0.5"
                      style={{ top, height }}
                    >
                      {event.title}
                      <div className="text-[10px] opacity-70">
                        {event.start}–{event.end}
                      </div>
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
