import { useState, useEffect } from "react";

interface DateFilterProps {
  dateRange: { start: number; end: number } | null;
  onDateRangeChange: (range: { start: number; end: number } | null) => void;
  availableRange: { earliest: number; latest: number } | null;
  isLoading: boolean;
}

export default function DateFilter({
  dateRange,
  onDateRangeChange,
  availableRange,
  isLoading,
}: DateFilterProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDefault, setIsDefault] = useState(true);

  useEffect(() => {
    setIsDefault(!dateRange);
  }, [dateRange]);

  const formatDateForInput = (timestamp: number) => {
    return new Date(timestamp).toISOString().split("T")[0];
  };

  const handleApplyFilter = () => {
    if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate + "T23:59:59").getTime();
      onDateRangeChange({ start, end });
    }
  };

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
    onDateRangeChange(null);
  };

  const handleSelectDay = (date: Date) => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    setStartDate(formatDateForInput(start.getTime()));
    setEndDate(formatDateForInput(end.getTime()));

    onDateRangeChange({
      start: start.getTime(),
      end: end.getTime(),
    });
  };

  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    onDateRangeChange({ start: start.getTime(), end: end.getTime() });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* First row: Quick filter buttons in 3 columns */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => handleSelectDay(new Date())}
          disabled={isLoading}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Today
        </button>
        <button
          onClick={() => setQuickRange(3)}
          disabled={isLoading}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          3 Days
        </button>
        <button
          onClick={() => setQuickRange(7)}
          disabled={isLoading}
          className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          7 Days
        </button>
      </div>

      {/* Second row: Date picker */}
      <div className="flex gap-2 items-center mb-4">
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          disabled={isLoading}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          min={
            availableRange
              ? formatDateForInput(availableRange.earliest)
              : undefined
          }
          max={
            availableRange
              ? formatDateForInput(availableRange.latest)
              : undefined
          }
        />
        <span className="text-gray-500 text-sm">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          disabled={isLoading}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          min={
            availableRange
              ? formatDateForInput(availableRange.earliest)
              : undefined
          }
          max={
            availableRange
              ? formatDateForInput(availableRange.latest)
              : undefined
          }
        />
      </div>

      {/* Third row: Apply and Reset buttons */}
      <div className="flex gap-2">
        <button
          onClick={handleApplyFilter}
          disabled={!startDate || !endDate || isLoading}
          className={`px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDefault ? "bg-gray-200 text-gray-700" : "bg-blue-600 text-white hover:bg-blue-700"}`}
        >
          Apply Filter
        </button>
        <button
          onClick={handleClearFilter}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isDefault
              ? "bg-gray-200 text-gray-700"
              : "bg-red-600 text-white hover:bg-red-700"
          }`}
        >
          Reset
        </button>
      </div>

      {dateRange && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Filtered:</span>{" "}
            {new Date(dateRange.start).toLocaleDateString()} -{" "}
            {new Date(dateRange.end).toLocaleDateString()}
          </p>
        </div>
      )}
    </div>
  );
}
