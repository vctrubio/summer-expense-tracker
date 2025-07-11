import { Doc } from "../convex/_generated/dataModel";
import { formatPrice } from "./lib/utils";

interface MobileBatteryBarProps {
  expenses: Doc<"expenses">[];
  deposits: Doc<"deposits">[];
}

export default function MobileBatteryBar({ expenses, deposits }: MobileBatteryBarProps) {
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.amount, 0);
  const totalDeposits = deposits.reduce((acc, dep) => acc + dep.amount, 0);
  const total = totalExpenses + totalDeposits;
  const difference = totalDeposits - totalExpenses;

  if (expenses.length === 0 && deposits.length === 0) {
    return null;
  }

  // Calculate percentages for the battery fill
  const expensesPercentage = total > 0 ? (totalExpenses / total) * 100 : 0;
  const depositsPercentage = total > 0 ? (totalDeposits / total) * 100 : 0;

  return (
    <div className="sm:hidden bg-white border-b border-gray-200 px-4 py-4">
      <div className="space-y-3">
        {/* Battery and Difference */}
        <div className="flex items-center justify-between">
          {/* Battery Icon with Fill - Flexible width */}
          <div className="flex items-center space-x-3 flex-1">
            <div className="relative flex-1 max-w-32">
              {/* Battery Outline */}
              <div className="w-full h-10 border-2 border-gray-400 rounded-sm relative bg-white">
                {/* Battery Tip */}
                <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1.5 h-4 bg-gray-400 rounded-r-sm"></div>
                
                {/* Battery Fill */}
                <div className="absolute inset-0.5 rounded-sm overflow-hidden">
                  {/* Expenses (Blue) */}
                  <div 
                    className="absolute left-0 top-0 h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${expensesPercentage}%` }}
                  ></div>
                  {/* Deposits (Gray) */}
                  <div 
                    className="absolute right-0 top-0 h-full bg-gray-500 transition-all duration-300"
                    style={{ width: `${depositsPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* Difference */}
          <div className="text-sm font-semibold ml-4">
            {difference >= 0 ? (
              <span className="text-green-600">+{formatPrice(difference, "deposit")}</span>
            ) : (
              <span className="text-red-600">{formatPrice(Math.abs(difference), "expense")}</span>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-xs text-gray-500">Expenses</span>
            <span className="text-xs font-medium text-gray-700">
              {formatPrice(totalExpenses, "expense")}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
            <span className="text-xs text-gray-500">Deposits</span>
            <span className="text-xs font-medium text-gray-700">
              {formatPrice(totalDeposits, "deposit")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}