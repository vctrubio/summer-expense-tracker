import { Id } from "../convex/_generated/dataModel";

interface Transaction {
  _id: Id<"expenses"> | Id<"deposits">;
  timestamp: number;
  amount: number;
  desc: string;
  label: string;
  dst?: string;
  by?: string;
  type: "expense" | "deposit";
}

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
}

export default function TransactionCard({
  transaction,
  onEdit,
  onDelete,
}: TransactionCardProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow group max-w-[385px] flex-1 min-w-[320px]">
      {/* First row: Amount and Description */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 pr-3">
          <p className="font-medium text-gray-900 text-sm truncate">
            {transaction.desc}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-bold ${
              transaction.type === "expense"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {transaction.type === "expense" ? "−" : "+"} $
            {transaction.amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Second row: Label and Destination/Source (if any) */}
      <div className="flex justify-between items-center">
        <div className="flex gap-2 text-xs text-gray-600">
          {transaction.label !== "General" && (
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              {transaction.label}
            </span>
          )}
          {((transaction.type === "expense" && transaction.dst) ||
            (transaction.type === "deposit" && transaction.by)) && (
            <span className="flex items-center gap-1 text-gray-500">
              {transaction.type === "expense" ? "→" : "←"}{" "}
              {transaction.type === "expense" ? transaction.dst : transaction.by}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-1">
          <button
            onClick={onEdit}
            className="opacity-0 group-hover:opacity-100 text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50 transition-all"
          >
            Edit
          </button>
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}