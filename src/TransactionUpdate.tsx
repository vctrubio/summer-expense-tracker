import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";
import { Id } from "../convex/_generated/dataModel";

interface TransactionUpdateProps {
  transactionUpdate: Set<string>;
  allTransactions: any[]; // This should be more specific, but for now, any[]
  onDeselectAll: () => void;
  owners: { _id: Id<"owners">; name: string }[];
  addOwner: (args: { name: string }) => Promise<Id<"owners">>;
}

export default function TransactionUpdate({
  transactionUpdate,
  allTransactions,
  onDeselectAll,
  owners,
  addOwner,
}: TransactionUpdateProps) {
  const [showUpdateDatePanel, setShowUpdateDatePanel] = useState(false);
  const [showUpdateOwnerPanel, setShowUpdateOwnerPanel] = useState(false);

  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newOwner, setNewOwner] = useState("");
  const updateExpense = useMutation(api.expenses.updateExpense);
  const updateDeposit = useMutation(api.expenses.updateDeposit);

  useEffect(() => {
    if (transactionUpdate.size === 0) {
      setShowUpdateDatePanel(false);
      setShowUpdateOwnerPanel(false);
    }
  }, [transactionUpdate.size]);

  const handleUpdateSelectedTransactions = async (field: 'timestamp' | 'owner', value: any) => {
    try {
      let finalValue = value;

      for (const id of transactionUpdate) {
        const transaction = allTransactions.find(t => t._id === id);
        if (transaction) {
          if (transaction.type === 'expense') {
            await updateExpense({
              id: transaction._id as Id<'expenses'>,
              amount: transaction.amount,
              desc: transaction.desc,
              timestamp: transaction.timestamp,
              ...(field === 'timestamp' && { timestamp: finalValue }),
              ...(field === 'owner' && { dst: finalValue === "" ? "" : finalValue }),
            });
          } else if (transaction.type === 'deposit') {
            await updateDeposit({
              id: transaction._id as Id<'deposits'>,
              amount: transaction.amount,
              desc: transaction.desc,
              timestamp: transaction.timestamp,
              ...(field === 'timestamp' && { timestamp: finalValue }),
              ...(field === 'owner' && { by: finalValue === "" ? "" : finalValue }),
            });
          }
        }
      }
      toast.success(`Successfully updated ${transactionUpdate.size} transactions.`);
      onDeselectAll(); // Close dropdowns and deselect all
    } catch (error) {
      toast.error(`Failed to update transactions.`);
      console.error("Failed to update transactions:", error);
    }
  };

  const handleUpdateDate = () => {
    setShowUpdateDatePanel(!showUpdateDatePanel);
    setShowUpdateOwnerPanel(false);
  };

  const handleUpdateOwner = () => {
    setShowUpdateOwnerPanel(!showUpdateOwnerPanel);
    setShowUpdateDatePanel(false);
  };

  return (
    <>
      {transactionUpdate.size > 0 && (
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg shadow-sm">
          <p className="text-sm text-blue-800">
            {transactionUpdate.size} selected
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleUpdateDate}
              className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Update Date
            </button>
            <button
              onClick={handleUpdateOwner}
              className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Update Owner
            </button>
            <button
              onClick={onDeselectAll}
              className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {showUpdateDatePanel && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h4 className="text-md font-medium text-gray-900 mb-2">Update Date for Selected Transactions</h4>
          <div className="flex items-center gap-1 mb-1">
            <button
              type="button"
              onClick={() => {
                const currentDate = new Date(newDate);
                currentDate.setDate(currentDate.getDate() - 1);
                setNewDate(currentDate.toISOString().split("T")[0]);
              }}
              className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded text-xs"
            >
              ←
            </button>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              required
            />
            <button
              type="button"
              onClick={() => {
                const currentDate = new Date(newDate);
                currentDate.setDate(currentDate.getDate() + 1);
                setNewDate(currentDate.toISOString().split("T")[0]);
              }}
              className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded text-xs"
            >
              →
            </button>
          </div>
          <button
            onClick={() => handleUpdateSelectedTransactions('timestamp', new Date(newDate).getTime())}
            className="mt-2 px-4 py-2 text-white rounded text-sm font-medium bg-blue-600 hover:bg-blue-700"
          >
            Update Date
          </button>
        </div>
      )}


      {showUpdateOwnerPanel && (
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h4 className="text-md font-medium text-gray-900 mb-2">Update Owner for Selected Transactions</h4>
          <select
            value={newOwner}
            onChange={(e) => setNewOwner(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Nobody</option>
            {owners.map((o) => (
              <option key={o._id} value={o.name}>
                {o.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => handleUpdateSelectedTransactions('owner', newOwner)}
            className="mt-2 px-4 py-2 text-white rounded text-sm font-medium bg-blue-600 hover:bg-blue-700"
          >
            Update Owner
          </button>
        </div>
      )}
    </>
  );
}
