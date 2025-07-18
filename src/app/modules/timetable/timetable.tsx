export default function TimeTable() {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const times = ["9am", "11am", "1pm", "2pm", "4pm", "6pm", "12am"]; // You can expand this

  return (
    <div className="p-4">
      <div
        className="grid"
        style={{
          gridTemplateColumns: `80px repeat(${times.length}, 1fr)`,
          gridTemplateRows: `40px repeat(${days.length}, 1fr)`,
        }}
      >
        {/* Top-left empty cell */}
        <div className="border border-blue-500"></div>

        {/* Time Headers */}
        {times.map((time, idx) => (
          <div
            key={idx}
            className="border border-blue-500 text-blue-300 text-sm text-center"
          >
            {time || "-"}
          </div>
        ))}

        {/* Rows: Day + Time cells */}
        {days.map((day, i) => (
          <>
            {/* Day label */}
            <div
              key={day + "-label"}
              className="border border-blue-500 text-blue-300 font-medium text-center"
            >
              {day}
            </div>

            {/* Empty time cells */}
            {times.map((_, j) => (
              <div
                key={`${i}-${j}`}
                className="border border-blue-500 hover:bg-blue-900 cursor-pointer"
              />
            ))}
          </>
        ))}
      </div>
    </div>
  );
}
