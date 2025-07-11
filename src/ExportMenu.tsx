import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

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
}

export default function ExportMenu({ data, dateRange }: ExportMenuProps) {
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
    } else if (type === 'expenses') {
      whatsappText += `Total Expenses: ${Math.round(totalExpenses)}€\n`;
    } else if (type === 'deposits') {
      whatsappText += `Total Deposits: ${Math.round(totalDeposits)}€\n`;
    }

    // Copy to clipboard and open WhatsApp
    navigator.clipboard.writeText(whatsappText).then(() => {
      toast.success('Copied to clipboard! Opening WhatsApp...');
      
      // Open WhatsApp Web with pre-filled text
      const encodedText = encodeURIComponent(whatsappText);
      window.open(`https://wa.me/?text=${encodedText}`, '_blank');
      
      setShowExportMenu(false);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  if (!data || allTransactions.length === 0) {
    return (
      <button
        disabled
        className="px-3 py-1 rounded transition-colors opacity-50 cursor-not-allowed text-sm text-gray-600"
      >
        <kbd className="mr-1">X</kbd> Export
      </button>
    );
  }

  return (
    <div className="relative" ref={exportMenuRef}>
      <button
        onClick={() => setShowExportMenu(!showExportMenu)}
        className="px-3 py-1 rounded transition-colors hover:bg-gray-100 text-sm text-gray-600"
      >
        <kbd className="mr-1">X</kbd> Export ▼
      </button>
      
      {showExportMenu && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-48">
          {/* CSV Export Section */}
          <div className="p-2 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">CSV Export</div>
            <button
              onClick={() => exportToCSV('all')}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
            >
              📊 All ({allTransactions.length})
            </button>
            <button
              onClick={() => exportToCSV('expenses')}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
            >
              📉 Expenses ({allTransactions.filter(t => t.type === 'expense').length})
            </button>
            <button
              onClick={() => exportToCSV('deposits')}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
            >
              📈 Deposits ({allTransactions.filter(t => t.type === 'deposit').length})
            </button>
          </div>
          
          {/* WhatsApp Export Section */}
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2">WhatsApp Export</div>
            <button
              onClick={() => exportToWhatsApp('all')}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
            >
              💬 All as Text
            </button>
            <button
              onClick={() => exportToWhatsApp('expenses')}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
            >
              💬 Expenses as Text
            </button>
            <button
              onClick={() => exportToWhatsApp('deposits')}
              className="block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 rounded"
            >
              💬 Deposits as Text
            </button>
          </div>
        </div>
      )}
    </div>
  );
}