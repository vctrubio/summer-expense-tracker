import ExportMenu from "./ExportMenu";

interface QuickActionsBarProps {
  activeForm: "expense" | "deposit" | "manage" | "csv" | null;
  setActiveForm: (form: "expense" | "deposit" | "manage" | "csv" | null) => void;
  setShowHotkeys: (show: boolean) => void;
  showHotkeys: boolean;
  data: {
    expenses: Array<any>;
    deposits: Array<any>;
  } | null;
  dateRange?: {
    start: number;
    end: number;
  } | null;
}

export default function QuickActionsBar({ 
  activeForm, 
  setActiveForm, 
  setShowHotkeys, 
  showHotkeys,
  data,
  dateRange
}: QuickActionsBarProps) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-200">
      <div className="flex items-center gap-4 text-sm text-gray-600">
        <button
          onClick={() =>
            setActiveForm(activeForm === "expense" ? null : "expense")
          }
          className={`px-3 py-1 rounded transition-colors ${
            activeForm === "expense"
              ? "bg-red-100 text-red-700"
              : "hover:bg-gray-100"
          }`}
        >
          <kbd className="mr-1">E</kbd> Expense
        </button>
        <button
          onClick={() =>
            setActiveForm(activeForm === "deposit" ? null : "deposit")
          }
          className={`px-3 py-1 rounded transition-colors ${
            activeForm === "deposit"
              ? "bg-green-100 text-green-700"
              : "hover:bg-gray-100"
          }`}
        >
          <kbd className="mr-1">D</kbd> Deposit
        </button>
        <button
          onClick={() => setActiveForm(activeForm === "csv" ? null : "csv")}
          className={`px-3 py-1 rounded transition-colors ${
            activeForm === "csv"
              ? "bg-purple-100 text-purple-700"
              : "hover:bg-gray-100"
          }`}
        >
          <kbd className="mr-1">C</kbd> Import CSV
        </button>
        <button
          onClick={() =>
            setActiveForm(activeForm === "manage" ? null : "manage")
          }
          className={`px-3 py-1 rounded transition-colors ${
            activeForm === "manage"
              ? "bg-blue-100 text-blue-700"
              : "hover:bg-gray-100"
          }`}
        >
          <kbd className="mr-1">M</kbd> Manage
        </button>
        
        <ExportMenu data={data} dateRange={dateRange} />
      </div>
      
      <button
        onClick={() => setShowHotkeys(!showHotkeys)}
        className="text-gray-500 hover:text-gray-700 text-sm"
      >
        <kbd>?</kbd> Help
      </button>
    </div>
  );
}