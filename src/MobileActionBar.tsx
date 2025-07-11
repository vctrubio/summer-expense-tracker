interface MobileActionBarProps {
  activeForm: "expense" | "deposit" | "manage" | "csv" | null;
  setActiveForm: (form: "expense" | "deposit" | "manage" | "csv" | null) => void;
}

export default function MobileActionBar({ 
  activeForm, 
  setActiveForm
}: MobileActionBarProps) {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 shadow-lg z-50">
      <div className="flex gap-3 max-w-md mx-auto">
        <button
          onClick={() =>
            setActiveForm(activeForm === "expense" ? null : "expense")
          }
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            activeForm === "expense"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Add Expense
        </button>
        <button
          onClick={() =>
            setActiveForm(activeForm === "deposit" ? null : "deposit")
          }
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
            activeForm === "deposit"
              ? "bg-gray-600 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          Add Deposit
        </button>
      </div>
    </div>
  );
}