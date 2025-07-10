import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";
import TransactionCard from "./TransactionCard";
import { formatPrice } from "./lib/utils";

interface Transaction {
  _id: Id<"expenses"> | Id<"deposits">;
  timestamp: number;
  amount: number;
  desc: string;
  label: string;
  dst?: string;
  by?: string;
}

interface TransactionListProps {
  data: {
    expenses: Array<Transaction & { _id: Id<"expenses"> }>;
    deposits: Array<Transaction & { _id: Id<"deposits"> }>;
    totalExpenses: number;
    totalDeposits: number;
  } | null;
  onEdit: (transaction: {
    id: string;
    type: "expense" | "deposit";
    amount: number;
    desc: string;
    label: string;
    owner?: string;
    timestamp: number;
  }) => void;
  isLoading: boolean;
  filters?: {
    type?: 'expense' | 'deposit';
    label?: string;
    owner?: string;
    sortBy?: 'date' | 'highest' | 'lowest';
  };
}

export default function TransactionList({
  data,
  onEdit,
  isLoading,
  filters = {},
}: TransactionListProps) {
  const deleteExpense = useMutation(api.expenses.deleteExpense);
  const deleteDeposit = useMutation(api.expenses.deleteDeposit);

  // Combine and filter transactions (but don't sort yet)
  const allTransactions = data
    ? [
        ...data.expenses.map((exp) => ({ ...exp, type: "expense" as const })),
        ...data.deposits.map((dep) => ({ ...dep, type: "deposit" as const })),
      ]
        .filter((transaction) => {
          // Filter by type
          if (filters.type && transaction.type !== filters.type) return false;
          
          // Filter by label
          if (filters.label && transaction.label !== filters.label) return false;
          
          // Filter by owner
          if (filters.owner) {
            const owner = transaction.type === "expense" ? transaction.dst : transaction.by;
            if (owner !== filters.owner) return false;
          }
          
          return true;
        })
        .sort((a, b) => b.timestamp - a.timestamp) // Always sort by date first for grouping
    : [];

  // Group transactions by date
  const groupedTransactions = allTransactions.reduce(
    (groups, transaction) => {
      const date = new Date(transaction.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    },
    {} as Record<string, typeof allTransactions>,
  );

  // Format date header with day of week and relative time
  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" });
    const monthDay = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    let relativeTime = "";
    if (diffDays === 0) relativeTime = "Today";
    else if (diffDays === 1) relativeTime = "Tomorrow";
    else if (diffDays === -1) relativeTime = "Yesterday";
    else if (diffDays < 0) relativeTime = `${Math.abs(diffDays)} days ago`;
    else relativeTime = `In ${diffDays} days`;

    return { dayOfWeek, monthDay, relativeTime };
  };

  const handleDelete = async (transaction: (typeof allTransactions)[0]) => {
    try {
      if (transaction.type === "expense") {
        await deleteExpense({ id: transaction._id as Id<"expenses"> });
      } else {
        await deleteDeposit({ id: transaction._id as Id<"deposits"> });
      }
      toast.success(`${transaction.type} deleted`);
    } catch (error) {
      toast.error(`Failed to delete ${transaction.type}`);
    }
  };

  const handleEdit = (transaction: (typeof allTransactions)[0]) => {
    onEdit({
      id: transaction._id,
      type: transaction.type,
      amount: transaction.amount,
      desc: transaction.desc,
      label: transaction.label,
      owner: transaction.type === "expense" ? transaction.dst : transaction.by,
      timestamp: transaction.timestamp,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (allTransactions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-2xl mb-2">📄</div>
        <p className="text-sm">No transactions found</p>
      </div>
    );
  }

  // Sort the grouped date entries based on the sortBy filter
  const sortedDateEntries = Object.entries(groupedTransactions).sort(([dateA, transactionsA], [dateB, transactionsB]) => {
    switch (filters.sortBy) {
      case 'highest':
        const expensesA = transactionsA.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const expensesB = transactionsB.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return expensesB - expensesA; // Highest expense dates first
      case 'lowest':
        const expensesA2 = transactionsA.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const expensesB2 = transactionsB.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        return expensesA2 - expensesB2; // Lowest expense dates first
      case 'date':
      default:
        return new Date(dateB).getTime() - new Date(dateA).getTime(); // Newest dates first
    }
  });

  return (
    <div className="space-y-6">
      {/* Date-grouped transactions */}
      {sortedDateEntries.map(([dateString, transactions]) => {
        const { dayOfWeek, monthDay, relativeTime } =
          formatDateHeader(dateString);
        
        // Calculate total expenses for this date
        const totalExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return (
          <div key={dateString} className="space-y-3">
            {/* Date header */}
            <div className="border-b border-gray-200 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">
                    {dayOfWeek} {monthDay}
                  </h3>
                  <p className="text-sm text-gray-500">{relativeTime}</p>
                </div>
                {totalExpenses > 0 && (
                  <div className="text-sm text-blue-600 font-medium">
                    {formatPrice(totalExpenses, "expense")}
                  </div>
                )}
              </div>
            </div>

            {/* Transaction cards */}
            <div className="flex flex-wrap gap-3">
              {transactions.map((transaction) => (
                <TransactionCard
                  key={transaction._id}
                  transaction={transaction}
                  onEdit={() => handleEdit(transaction)}
                  onDelete={() => { handleDelete(transaction); }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
