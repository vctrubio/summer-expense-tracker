import { Doc } from "../convex/_generated/dataModel";
import { cn, formatPrice } from "./lib/utils";

interface BalanceBarProps {
  expenses: Doc<"expenses">[];
  deposits: Doc<"deposits">[];
}

export default function BalanceBar({ expenses, deposits }: BalanceBarProps) {
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalDeposits = deposits.reduce((acc, dep) => acc + dep.amount, 0);
  const balance = totalDeposits - totalExpenses;

  const depositsPercentage =
    totalDeposits + totalExpenses > 0
      ? (totalDeposits / (totalDeposits + totalExpenses)) * 100
      : 0;

  if (expenses.length === 0 && deposits.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-500">No financial data available.</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white p-6 rounded-lg border border-gray-200">
      <div className="flex justify-end items-center mb-4">
        <div className="text-xl font-bold text-gray-700">
          {balance >= 0 
            ? `+ ${balance.toFixed(2)} €` 
            : `- ${Math.abs(balance).toFixed(2)} €`
          }
        </div>
      </div>

      <div className="space-y-4">
        {/* Financial Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-gray-700">
              {formatPrice(totalDeposits, "deposit")}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <p className="text-2xl font-bold text-blue-600">
              {formatPrice(totalExpenses, "expense")}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <div className="relative w-full h-4 bg-blue-200 rounded-full overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-gray-400"
              style={{ width: `${depositsPercentage}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>Expenses</span>
            <span>Deposits</span>
          </div>
        </div>
      </div>
    </div>
  );
}