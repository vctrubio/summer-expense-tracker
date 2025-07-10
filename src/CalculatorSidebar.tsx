import DateFilter from "./DateFilter";
import FilterBar from "./FilterBar";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import { Id } from "../convex/_generated/dataModel";

interface CalculatorSidebarProps {
  transactionsData: {
    expenses: any[];
    deposits: any[];
  } | null;
  dateRange: {
    start: number;
    end: number;
  } | null;
  onDateRangeChange: (range: { start: number; end: number } | null) => void;
  dateRangeData: { earliest: number; latest: number } | null;
  isLoading: boolean;
  filters: {
    type?: 'expense' | 'deposit';
    label?: string;
    owner?: string;
    sortBy?: 'date' | 'highest' | 'lowest';
  };
  onFilterChange: (filters: {
    type?: 'expense' | 'deposit';
    label?: string;
    owner?: string;
    sortBy?: 'date' | 'highest' | 'lowest';
  }) => void;
}

export default function CalculatorSidebar({
  transactionsData,
  dateRange,
  onDateRangeChange,
  dateRangeData,
  isLoading,
  filters,
  onFilterChange
}: CalculatorSidebarProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const deleteDeposit = useMutation(api.expenses.deleteDeposit);

  const handleDeleteAll = async () => {
    if (!transactionsData) return;
    if (!confirm("Are you sure you want to delete ALL transactions? This cannot be undone.")) return;
    
    setIsDeleting(true);
    try {
      // Delete all expenses
      for (const expense of transactionsData.expenses) {
        await deleteExpense({ id: expense._id as Id<"expenses"> });
      }
      // Delete all deposits
      for (const deposit of transactionsData.deposits) {
        await deleteDeposit({ id: deposit._id as Id<"deposits"> });
      }
      toast.success("All transactions deleted");
    } catch (error) {
      toast.error("Failed to delete all transactions");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteExpenses = async () => {
    if (!transactionsData) return;
    if (!confirm(`Delete all ${transactionsData.expenses.length} expenses? This cannot be undone.`)) return;
    
    setIsDeleting(true);
    try {
      for (const expense of transactionsData.expenses) {
        await deleteExpense({ id: expense._id as Id<"expenses"> });
      }
      toast.success("All expenses deleted");
    } catch (error) {
      toast.error("Failed to delete expenses");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteDeposits = async () => {
    if (!transactionsData) return;
    if (!confirm(`Delete all ${transactionsData.deposits.length} deposits? This cannot be undone.`)) return;
    
    setIsDeleting(true);
    try {
      for (const deposit of transactionsData.deposits) {
        await deleteDeposit({ id: deposit._id as Id<"deposits"> });
      }
      toast.success("All deposits deleted");
    } catch (error) {
      toast.error("Failed to delete deposits");
    } finally {
      setIsDeleting(false);
    }
  };
  return (
    <div className="space-y-4 max-w-lg">
      {/* Compact Balance Overview */}
      {transactionsData && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="text-center space-y-3">
            <h3 className="text-sm font-medium text-gray-700">Balance</h3>
            
            {(() => {
              const totalExpenses = transactionsData.expenses.reduce((acc, exp) => acc + exp.amount, 0);
              const totalDeposits = transactionsData.deposits.reduce((acc, dep) => acc + dep.amount, 0);
              const balance = totalDeposits - totalExpenses;
              
              return (
                <>
                  <div className={`text-2xl font-bold ${
                    balance > 0 ? 'text-gray-700' : 
                    balance < 0 ? 'text-blue-600' : 'text-gray-700'
                  }`}>
                    {balance >= 0 
                      ? `+ ${balance.toFixed(2)} €` 
                      : `- ${Math.abs(balance).toFixed(2)} €`
                    }
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-gray-50 p-2 rounded">
                      <div className="text-gray-600 font-medium">In</div>
                      <div className="text-gray-700 font-bold">+ {totalDeposits.toFixed(2)} €</div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded">
                      <div className="text-blue-600 font-medium">Out</div>
                      <div className="text-blue-700 font-bold">- {totalExpenses.toFixed(2)} €</div>
                    </div>
                  </div>
                  
                  {/* Mini Progress Bar */}
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${totalExpenses + totalDeposits > 0 ? 
                          (totalDeposits / (totalExpenses + totalDeposits)) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      <DateFilter
        dateRange={dateRange}
        onDateRangeChange={onDateRangeChange}
        availableRange={dateRangeData}
        isLoading={isLoading}
      />

      <FilterBar
        filters={filters}
        onFilterChange={onFilterChange}
      />

      {/* Admin Section */}
      {transactionsData && (transactionsData.expenses.length > 0 || transactionsData.deposits.length > 0) && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Admin</h3>
          <div className="space-y-2">
            <button
              onClick={handleDeleteAll}
              disabled={isDeleting}
              className="w-full px-3 py-2 text-xs bg-gray-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isDeleting ? 'Deleting...' : 'Delete All'}
            </button>
            {transactionsData.expenses.length > 0 && (
              <button
                onClick={handleDeleteExpenses}
                disabled={isDeleting}
                className="w-full px-3 py-2 text-xs border border-gray-300 text-gray-600 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                Delete Expenses ({transactionsData.expenses.length})
              </button>
            )}
            {transactionsData.deposits.length > 0 && (
              <button
                onClick={handleDeleteDeposits}
                disabled={isDeleting}
                className="w-full px-3 py-2 text-xs border border-gray-300 text-gray-600 rounded hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600 transition-colors disabled:opacity-50"
              >
                Delete Deposits ({transactionsData.deposits.length})
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}