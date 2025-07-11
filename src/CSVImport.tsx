import { useState, useRef, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";

interface CSVImportProps {
  isOpen: boolean;
  onClose: () => void;
  owners: { _id: Id<"owners">; name: string }[];
}

interface CSVRow {
  date: string;
  amount: string;
  description: string;
  destination: string;
  type: "expense" | "deposit";
}

export default function CSVImport({ isOpen, onClose, owners }: CSVImportProps) {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quickText, setQuickText] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const saved = localStorage.getItem("transactionFormDate");
    return saved || new Date().toISOString().split("T")[0];
  });
  const [displayMode, setDisplayMode] = useState<"quickText" | "csvUpload">(
    "quickText",
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save selected date to localStorage
  useEffect(() => {
    localStorage.setItem("transactionFormDate", selectedDate);
  }, [selectedDate]);

  const addExpense = useMutation(api.expenses.addExpense);
  const addDeposit = useMutation(api.expenses.addDeposit);

  const parseQuickText = (text: string) => {
    const lines = text.split("\n").filter((line) => line.trim());
    const rows: CSVRow[] = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;

      // Split by comma and get parts
      const parts = trimmedLine.split(",").map((p) => p.trim());
      if (parts.length < 2) continue;

      const amount = parts[0];
      const description = parts[1];
      const destination = parts[2] || ""; // Optional third part

      // Validate amount is numeric
      if (isNaN(parseFloat(amount))) continue;

      rows.push({
        date: selectedDate,
        amount: amount,
        description: description,
        destination: destination,
        type: "expense", // default to expense
      });
    }

    return rows;
  };

  const handleQuickTextProcess = () => {
    if (!quickText.trim()) {
      toast.error("Please enter some data");
      return;
    }

    const parsedData = parseQuickText(quickText);
    if (parsedData.length === 0) {
      toast.error("No valid entries found. Format: amount, description");
      return;
    }

    setCsvData((prev) => [...prev, ...parsedData]);
    setQuickText("");
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());

      const rows: CSVRow[] = lines.map((line) => {
        const columns = line
          .split(",")
          .map((col) => col.replace(/"/g, "").trim());
        return {
          date: columns[0] || "",
          amount: columns[1] || "",
          description: columns[2] || "",
          destination: columns[3] || "",
          type: "expense", // default to expense
        };
      });

      setCsvData((prev) => [...prev, ...rows]);
    };
    reader.readAsText(file);
  };

  const handleTypeChange = (index: number, type: "expense" | "deposit") => {
    setCsvData((prev) =>
      prev.map((row, i) => (i === index ? { ...row, type } : row)),
    );
  };

  const handleFieldChange = (
    index: number,
    field: keyof CSVRow,
    value: string,
  ) => {
    setCsvData((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const handleRemoveRow = (index: number) => {
    setCsvData((prev) => prev.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (csvData.length === 0) {
      toast.error("No data to import");
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const row of csvData) {
        try {
          const amount = parseFloat(row.amount);
          if (isNaN(amount) || !row.description.trim()) {
            errorCount++;
            continue;
          }

          const timestamp = row.date
            ? new Date(row.date).getTime()
            : Date.now();

          const transactionData = {
            amount,
            desc: row.description.trim(),
            timestamp: isNaN(timestamp) ? Date.now() : timestamp,
          };

          if (row.type === "expense") {
            await addExpense({
              ...transactionData,
              dst: row.destination.trim() || undefined,
            });
          } else {
            await addDeposit({
              ...transactionData,
              by: row.destination.trim() || undefined,
            });
          }

          successCount++;
        } catch (error) {
          errorCount++;
          console.error("Error importing row:", error);
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} transactions`);
      }
      if (errorCount > 0) {
        toast.error(`Failed to import ${errorCount} transactions`);
      }

      // Reset form
      setCsvData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    } catch (error) {
      toast.error("Import failed");
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  // Calculate totals for preview
  const totalExpenses = csvData
    .filter((row) => row.type === "expense" && !isNaN(parseFloat(row.amount)))
    .reduce((sum, row) => sum + parseFloat(row.amount), 0);

  const totalDeposits = csvData
    .filter((row) => row.type === "deposit" && !isNaN(parseFloat(row.amount)))
    .reduce((sum, row) => sum + parseFloat(row.amount), 0);

  const overallTotal = totalDeposits - totalExpenses;

  const formatAmount = (amount: number) => {
    const formatted = amount.toFixed(2);
    if (formatted.startsWith("-")) {
      return `- ${formatted.substring(1)}€`;
    }
    return `${formatted}€`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800">CSV Import</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          ×
        </button>
      </div>

      <div className="mb-4 flex space-x-2">
        <button
          onClick={() => setDisplayMode("quickText")}
          className={`px-4 py-2 rounded text-sm ${displayMode === "quickText" ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
        >
          Quick Entry
        </button>
        <button
          onClick={() => setDisplayMode("csvUpload")}
          className={`px-4 py-2 rounded text-sm ${displayMode === "csvUpload" ? "bg-gray-900 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
        >
          CSV Upload
        </button>
      </div>

      <div className="space-y-6">
        {displayMode === "quickText" && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Amount, Description, Destination (?)
              </label>
              <div className="text-xs text-gray-500">
                <kbd className="px-1 py-0.5 bg-gray-100 rounded">
                  Shift+Enter
                </kbd>{" "}
                to process
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="md:col-span-2">
                <textarea
                  value={quickText}
                  onChange={(e) => setQuickText(e.target.value)}
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      (e.shiftKey || e.metaKey || e.ctrlKey)
                    ) {
                      e.preventDefault();
                      handleQuickTextProcess();
                    }
                  }}
                  placeholder="20, ice cream
39, gas
15, coffee"
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date for all entries
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <button
                  onClick={handleQuickTextProcess}
                  className="w-full px-4 py-3 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 transition-colors"
                >
                  Process
                </button>
              </div>
            </div>
          </div>
        )}

        {displayMode === "csvUpload" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <div className="text-xs text-gray-500 mb-2">
              Expected format: Date, Amount, Description, Name (optional)
            </div>
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="text-center">
                  <div className="mb-2 text-gray-400">
                    <svg
                      className="w-8 h-8 mx-auto"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-900">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">CSV files only</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Data */}
        {csvData.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-gray-800">
              Preview & Configure ({csvData.length} rows)
            </h4>
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-2 py-1 text-left">Date</th>
                    <th className="px-2 py-1 text-left">Amount</th>
                    <th className="px-2 py-1 text-left">Description</th>
                    <th className="px-2 py-1 text-left">Destination</th>
                    <th className="px-2 py-1 text-left">Type</th>
                    <th className="px-2 py-1 text-left"></th>
                  </tr>
                </thead>
                <tbody>
                  {csvData.map((row, index) => (
                    <tr key={index} className="border-t border-gray-100">
                      <td className="px-2 py-1">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) =>
                            handleFieldChange(index, "date", e.target.value)
                          }
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="number"
                          step="0.01"
                          value={row.amount}
                          onChange={(e) =>
                            handleFieldChange(index, "amount", e.target.value)
                          }
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.description}
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              "description",
                              e.target.value,
                            )
                          }
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        />
                      </td>
                      <td className="px-2 py-1">
                        <input
                          type="text"
                          value={row.destination}
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              "destination",
                              e.target.value,
                            )
                          }
                          list="owners-datalist"
                          className={`w-full text-xs border border-gray-300 rounded px-2 py-1 ${
                            !owners.some((o) => o.name === row.destination) &&
                            row.destination !== ""
                              ? "text-red-500 border-red-500"
                              : ""
                          }`}
                        />
                        <datalist id="owners-datalist">
                          {owners.map((owner) => (
                            <option key={owner._id} value={owner.name} />
                          ))}
                        </datalist>
                      </td>
                      <td className="px-2 py-1">
                        <select
                          value={row.type}
                          onChange={(e) =>
                            handleTypeChange(
                              index,
                              e.target.value as "expense" | "deposit",
                            )
                          }
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="expense">Expense</option>
                          <option value="deposit">Deposit</option>
                        </select>
                      </td>
                      <td className="px-2 py-1">
                        <button
                          onClick={() => handleRemoveRow(index)}
                          className="text-red-500 hover:text-red-700 text-xs"
                          title="Remove row"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="text-sm font-medium text-gray-700 mt-4 text-right space-y-1">
              {totalExpenses > 0 && (
                <div>Expenses: {formatAmount(totalExpenses)}</div>
              )}
              {totalDeposits > 0 && (
                <div>Deposits: {formatAmount(totalDeposits)}</div>
              )}
              {(totalExpenses > 0 || totalDeposits > 0) && (
                <div className="font-semibold pt-2 border-t border-gray-200">
                  Total: {formatAmount(overallTotal)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          {csvData.length > 0 ? (
            <button
              onClick={() => setCsvData([])}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
            >
              Clear All
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          )}
          {csvData.length > 0 && (
            <button
              onClick={handleImport}
              disabled={isProcessing}
              className="px-4 py-2 bg-gray-900 text-white rounded text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {isProcessing
                ? "Importing..."
                : `Import ${csvData.length} Transactions`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
