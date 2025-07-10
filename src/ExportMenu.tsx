import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";

interface Transaction {
  _id: string;
  timestamp: number;
  amount: number;
  desc: string;
  label: string;
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

    const headers = ['Date', 'Type', 'Amount', 'Description', 'Label', 'Owner'];
    const rows = transactions.map(t => [
      new Date(t.timestamp).toLocaleDateString(),
      t.type,
      t.amount.toFixed(2),
      t.desc,
      t.label,
      t.type === 'expense' ? (t.dst || '') : (t.by || '')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Create filename with date range if applicable
    let filename = `${type}-${new Date().toISOString().split('T')[0]}`;
    if (dateRange) {
      const startDate = new Date(dateRange.start).toISOString().split('T')[0];
      const endDate = new Date(dateRange.end).toISOString().split('T')[0];
      filename = `${type}-${startDate}-to-${endDate}`;
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
    let whatsappText = `${type.charAt(0).toUpperCase() + type.slice(1)} Summary

`;
    
    Object.entries(groupedTransactions).forEach(([dateString, dayTransactions]) => {
      const date = new Date(dateString);
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
      const formattedDate = date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
      
      whatsappText += `${dayOfWeek}, ${formattedDate}\n`;
      
      dayTransactions.forEach(transaction => {
        const amount = `${transaction.type === 'expense' ? '-' : '+'}${transaction.amount.toFixed(2)}€`;
        const label = transaction.label !== 'General' ? `, ${transaction.label}` : '';
        const owner = (transaction.type === 'expense' && transaction.dst) || 
                     (transaction.type === 'deposit' && transaction.by) ? 
                     `, ${transaction.type === 'expense' ? transaction.dst : transaction.by}` : '';
        
        whatsappText += `- ${amount}, ${transaction.desc}${label}${owner}\n`;
      });
      
      whatsappText += '\n';
    });

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