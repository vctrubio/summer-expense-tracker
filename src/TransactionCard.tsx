import { Id } from "../convex/_generated/dataModel";

interface Transaction {
  _id: Id<"expenses"> | Id<"deposits">;
  timestamp: number;
  amount: number;
  desc: string;
  dst?: string;
  by?: string;
  type: "expense" | "deposit";
}

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  isSelected: boolean;
  onClick: () => void;
}

export default function TransactionCard({
  transaction,
  onEdit,
  onDelete,
  isSelected,
  onClick,
}: TransactionCardProps) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow group w-full sm:max-w-[325px] sm:flex-1 sm:min-w-[320px] sm:cursor-pointer ${isSelected ? "border-l-4 border-blue-500" : ""}`}
      onClick={window.innerWidth >= 700 ? onClick : undefined}
    >
      {/* Mobile: Single row layout */}
      <div className="flex justify-between items-center sm:hidden">
        <div className="flex-1 min-w-0 pr-3">
          <p className="font-normal text-gray-800 text-sm tracking-wide font-sans truncate">
            {transaction.desc}
          </p>
          {((transaction.type === "expense" && transaction.dst) ||
            (transaction.type === "deposit" && transaction.by)) && (
            <span className="flex items-center gap-1 text-gray-500 text-xs mt-1">
              {transaction.type === "expense" ? "→" : "←"}{" "}
              {transaction.type === "expense"
                ? transaction.dst
                : transaction.by}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-bold ${
              transaction.type === "expense"
                ? "bg-blue-50 text-blue-700"
                : "bg-gray-50 text-gray-700"
            }`}
          >
            {Math.round(transaction.amount)} €
          </span>
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50 transition-all"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Desktop: Two row layout */}
      <div className="hidden sm:block">
        {/* First row: Amount and Description */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1 min-w-0 pr-3">
            <p className="font-normal text-gray-800 text-base tracking-wide font-sans truncate">
              {transaction.desc}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-bold ${
                transaction.type === "expense"
                  ? "bg-blue-50 text-blue-700"
                  : "bg-gray-50 text-gray-700"
              }`}
            >
              {Math.round(transaction.amount)} €
            </span>
          </div>
        </div>

        {/* Second row: Destination/Source (if any) */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 text-xs text-gray-600">
            {((transaction.type === "expense" && transaction.dst) ||
              (transaction.type === "deposit" && transaction.by)) && (
              <span className="flex items-center gap-1 text-gray-500">
                {transaction.type === "expense" ? "→" : "←"}{" "}
                {transaction.type === "expense"
                  ? transaction.dst
                  : transaction.by}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50 transition-all"
            >
              Edit
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50 transition-all"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
