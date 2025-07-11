import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { calculateOwnerBalances } from "./lib/utils";

interface Transaction {
  _id: string;
  timestamp: number;
  amount: number;
  desc: string;
  dst?: string;
  by?: string;
  type: 'expense' | 'deposit';
}

interface ExportMenuProps {
  data: {
    expenses: Array<any>;
    deposits: Array<any>;
  } | null;
  dateRange?: {
    start: number;
    end: number;
  } | null;
  owners: Array<{ _id: string; name: string }>;
}

export default function ExportMenu({ data, dateRange, owners }: ExportMenuProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle 'X' keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'x' && !showExportMenu) {
        // Don't trigger if user is typing in an input
        if (
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }
        e.preventDefault();
        setShowExportMenu(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExportMenu]);

  // Combine and sort transactions
  const allTransactions: Transaction[] = data ? [
    ...data.expenses.map(exp => ({ ...exp, type: 'expense' as const })),
    ...data.deposits.map(dep => ({ ...dep, type: 'deposit' as const }))
  ].sort((a, b) => b.timestamp - a.timestamp) : [];

  const exportToCSV = (type: 'all' | 'expenses' | 'deposits') => {
    let transactions = allTransactions;
    
    // Filter by type
    if (type === 'expenses') {
      transactions = allTransactions.filter(t => t.type === 'expense');
    } else if (type === 'deposits') {
      transactions = allTransactions.filter(t => t.type === 'deposit');
    }

    if (transactions.length === 0) {
      toast.error(`No ${type} found to export`);
      return;
    }

    const headers = ['Date', 'Type', 'Amount', 'Description', 'Sister'];
    const rows = transactions.map(t => [
      new Date(t.timestamp).toLocaleDateString(),
      t.type,
      t.amount.toFixed(2),
      t.desc,
      t.type === 'expense' ? (t.dst || '') : (t.by || '')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Create filename with tarifa naming, date range, and total days
    const year = new Date().getFullYear();
    let filename = type === 'all' ? `tarifa-${year}` : `${type}-tarifa-${year}`;

    if (allTransactions.length > 0) {
      const firstTransactionDate = new Date(allTransactions[allTransactions.length - 1].timestamp);
      const lastTransactionDate = new Date(allTransactions[0].timestamp);

      const diffTime = Math.abs(lastTransactionDate.getTime() - firstTransactionDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day

      const formattedFirstDate = firstTransactionDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '');
      const formattedLastDate = lastTransactionDate.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '');

      filename += `-${formattedFirstDate}-${formattedLastDate}-${diffDays}days`;
    } else {
      // If no transactions, just use today's date with the base filename
      const today = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '');
      filename += `-${today}`;
    }
    
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
    toast.success(`Exported ${transactions.length} ${type}`);
  };

  const exportToWhatsApp = (type: 'all' | 'expenses' | 'deposits') => {
    let transactions = allTransactions;
    
    // Filter by type
    if (type === 'expenses') {
      transactions = allTransactions.filter(t => t.type === 'expense');
    } else if (type === 'deposits') {
      transactions = allTransactions.filter(t => t.type === 'deposit');
    }

    if (transactions.length === 0) {
      toast.error(`No ${type} found to export`);
      return;
    }

    // Group transactions by date
    const groupedTransactions = transactions.reduce((groups, transaction) => {
      const date = new Date(transaction.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, Transaction[]>);

    // Format for WhatsApp
    let whatsappText = '';
    if (type !== 'all') {
      whatsappText += `${type.charAt(0).toUpperCase() + type.slice(1)} Summary

`;
    }
    
    Object.entries(groupedTransactions).forEach(([dateString, dayTransactions]) => {
      const date = new Date(dateString);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      
      whatsappText += `${dayOfWeek}, ${formattedDate}\n`;
      
      dayTransactions.forEach(transaction => {
        const amount = `${transaction.type === 'expense' ? '- ' : '+ '}${Math.round(transaction.amount)}€`;
        const owner = (transaction.type === 'expense' && transaction.dst) || 
                     (transaction.type === 'deposit' && transaction.by) ? 
                     `, ${transaction.type === 'expense' ? transaction.dst : transaction.by}` : '';
        
        whatsappText += `${amount}, ${transaction.desc}${owner}\n`;
      });
      
      whatsappText += '\n';
    });

    // Calculate totals
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDeposits = transactions
      .filter(t => t.type === 'deposit')
      .reduce((sum, t) => sum + t.amount, 0);
    const overallTotal = totalDeposits - totalExpenses;

    // Add totals to WhatsApp text
    if (type === 'all') {
      whatsappText += `Expenses: ${Math.round(totalExpenses)}€\n`;
      whatsappText += `Deposits: ${Math.round(totalDeposits)}€\n`;
      whatsappText += `Total: ${Math.round(overallTotal)}€\n`;

      // Owner-specific balances
      const { ownerBalances, robenaSharedExpense, patriciaSharedExpense } =
        calculateOwnerBalances(data.expenses, data.deposits, owners);

      whatsappText += `\n--- Owner Balances ---\n`;
      owners.forEach(owner => {
        const balance = ownerBalances[owner.name];
        if (balance) {
          const totalToPay = (balance.expenses + balance.sharedExpenses) - balance.deposits;
          whatsappText += `${owner.name}:\n`;
          whatsappText += `  Deposited: ${balance.deposits.toFixed(2)} €\n`;
          whatsappText += `  Expenses: ${balance.expenses.toFixed(2)} €\n`;
          if (owner.name === "Robena") {
            whatsappText += `  Shared Expenses (2/3): ${robenaSharedExpense.toFixed(2)} €\n`;
          } else if (owner.name === "Patricia") {
            whatsappText += `  Shared Expenses (1/3): ${patriciaSharedExpense.toFixed(2)} €\n`;
          }
          if (totalToPay > 0) {
            whatsappText += `  Missing: ${totalToPay.toFixed(2)} €\n`;
          } else if (totalToPay < 0) {
            whatsappText += `  Overpaid: ${Math.abs(totalToPay).toFixed(2)} €\n`;
          } else {
            whatsappText += `  Balance Clear\n`;
          }
        }
      });
    } else if (type === 'expenses') {
      whatsappText += `Total Expenses: ${Math.round(totalExpenses)}€\n`;
    } else if (type === 'deposits') {
      whatsappText += `Total Deposits: ${Math.round(totalDeposits)}€\n`;
    }

    // Copy to clipboard and open WhatsApp
    navigator.clipboard.writeText(whatsappText).then(() => {
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} copied to clipboard!`);
      window.open(`https://wa.me/?text=${encodeURIComponent(whatsappText)}`, '_blank');
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
    
    setShowExportMenu(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        className={`px-3 py-1 rounded transition-colors ${
          showExportMenu
            ? "bg-orange-100 text-orange-700"
            : "hover:bg-gray-100"
        }`}
      >
        <kbd className="mr-1">X</kbd> Export
      </button>

      {showExportMenu && (
        <div
          ref={exportMenuRef}
          className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded shadow-lg p-4 min-w-[200px] z-50"
        >
          <h3 className="font-semibold mb-3">Export Options</h3>
          
          <div className="space-y-2">
            <div>
              <h4 className="text-sm font-medium mb-2">CSV Export</h4>
              <div className="space-y-1">
                <button
                  onClick={() => exportToCSV('all')}
                  className="w-full text-left px-3 py-1 hover:bg-gray-100 rounded text-sm"
                >
                  All Transactions
                </button>
                <button
                  onClick={() => exportToCSV('expenses')}
                  className="w-full text-left px-3 py-1 hover:bg-gray-100 rounded text-sm"
                >
                  Expenses Only
                </button>
                <button
                  onClick={() => exportToCSV('deposits')}
                  className="w-full text-left px-3 py-1 hover:bg-gray-100 rounded text-sm"
                >
                  Deposits Only
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-2">WhatsApp Export</h4>
              <div className="space-y-1">
                <button
                  onClick={() => exportToWhatsApp('all')}
                  className="w-full text-left px-3 py-1 hover:bg-gray-100 rounded text-sm"
                >
                  All Transactions
                </button>
                <button
                  onClick={() => exportToWhatsApp('expenses')}
                  className="w-full text-left px-3 py-1 hover:bg-gray-100 rounded text-sm"
                >
                  Expenses Only
                </button>
                <button
                  onClick={() => exportToWhatsApp('deposits')}
                  className="w-full text-left px-3 py-1 hover:bg-gray-100 rounded text-sm"
                >
                  Deposits Only
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}