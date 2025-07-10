import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface TransactionFormProps {
  type: 'expense' | 'deposit';
  isOpen: boolean;
  onClose: () => void;
  editData?: {
    id: string;
    amount: number;
    desc: string;
    label: string;
    owner?: string;
    timestamp: number;
  };
}

export default function TransactionForm({ type, isOpen, onClose, editData }: TransactionFormProps) {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [label, setLabel] = useState('');
  const [owner, setOwner] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [customOwner, setCustomOwner] = useState('');
  const [date, setDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stayOpen, setStayOpen] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);

  const labels = useQuery(api.labels.list) || [];
  const owners = useQuery(api.owners.list) || [];
  
  const addExpense = useMutation(api.expenses.addExpense);
  const addDeposit = useMutation(api.expenses.addDeposit);
  const updateExpense = useMutation(api.expenses.updateExpense);
  const updateDeposit = useMutation(api.expenses.updateDeposit);
  const addLabel = useMutation(api.labels.add);
  const addOwner = useMutation(api.owners.add);

  // Focus on amount input when form opens
  useEffect(() => {
    if (isOpen && amountRef.current) {
      amountRef.current.focus();
    }
  }, [isOpen]);

  // Populate form when editing
  useEffect(() => {
    if (editData) {
      setAmount(editData.amount.toString());
      setDesc(editData.desc);
      setLabel(editData.label);
      setOwner(editData.owner || '');
      setDate(new Date(editData.timestamp).toISOString().split('T')[0]);
    } else {
      // Reset form for new transaction
      setAmount('');
      setDesc('');
      setLabel('');
      setOwner('');
      setCustomLabel('');
      setCustomOwner('');
      
      // Load saved date from localStorage or default to today
      const savedDate = localStorage.getItem('transactionFormDate');
      if (savedDate) {
        setDate(savedDate);
      } else {
        setDate(new Date().toISOString().split('T')[0]);
      }
    }
  }, [editData, isOpen]);

  // Save date to localStorage whenever it changes (but not during editing)
  useEffect(() => {
    if (!editData && date) {
      localStorage.setItem('transactionFormDate', date);
    }
  }, [date, editData]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if ((e.key === 'Enter' && (e.shiftKey || e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        // Create a synthetic form event to trigger submit
        const form = document.querySelector('form');
        if (form) {
          const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
          form.dispatchEvent(submitEvent);
        }
      } else if (e.key === 't' || e.key === 'T') {
        // Only toggle if not editing and not focused on an input
        if (!editData && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'SELECT') {
          e.preventDefault();
          setStayOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, editData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !desc || !date) {
      toast.error("Amount, description, and date are required");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalLabel = label;
      let finalOwner = owner;

      // Add custom label if provided
      if (customLabel && !label) {
        await addLabel({ name: customLabel });
        finalLabel = customLabel;
      }

      // Add custom owner if provided
      if (customOwner && !owner) {
        await addOwner({ name: customOwner });
        finalOwner = customOwner;
      }

      const transactionData = {
        amount: parseFloat(amount),
        desc,
        label: finalLabel || 'General',
        timestamp: new Date(date).getTime(),
      };

      if (editData) {
        // Update existing transaction
        if (type === 'expense') {
          await updateExpense({
            id: editData.id as any,
            ...transactionData,
            dst: finalOwner || undefined,
          });
          toast.success("Expense updated");
        } else {
          await updateDeposit({
            id: editData.id as any,
            ...transactionData,
            by: finalOwner || undefined,
          });
          toast.success("Deposit updated");
        }
      } else {
        // Add new transaction
        if (type === 'expense') {
          await addExpense({
            ...transactionData,
            dst: finalOwner || undefined,
          });
          toast.success("Expense added");
        } else {
          await addDeposit({
            ...transactionData,
            by: finalOwner || undefined,
          });
          toast.success("Deposit added");
        }
      }

      // Reset form (except date if stayOpen is true)
      setAmount('');
      setDesc('');
      setLabel('');
      setOwner('');
      setCustomLabel('');
      setCustomOwner('');
      
      // Close form or focus amount input based on stay open toggle
      if (stayOpen) {
        // Focus amount input after a brief delay to ensure form is reset
        setTimeout(() => {
          if (amountRef.current) {
            amountRef.current.focus();
          }
        }, 50);
      } else {
        onClose();
        // Reset date to today when closing the form
        setDate(new Date().toISOString().split('T')[0]);
      }
    } catch (error) {
      toast.error(`Failed to ${editData ? 'update' : 'add'} transaction`);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800">
          {editData ? 'Edit' : 'Add'} {type === 'expense' ? 'Expense' : 'Deposit'}
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <kbd className="px-1 py-0.5 bg-gray-100 rounded">Shift+Enter</kbd> to submit, <kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> to close
          {!editData && (
            <>
              , <kbd 
                className={`px-1 py-0.5 rounded cursor-pointer transition-colors ${
                  stayOpen 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
                onClick={() => setStayOpen(!stayOpen)}
                title="Toggle stay open"
              >
                T
              </kbd> to toggle
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-6 gap-3">
        <div>
          <input
            ref={amountRef}
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Amount"
            required
          />
        </div>

        <div>
          <input
            type="text"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            placeholder="Description"
            required
          />
        </div>

        <div>
          <div className="flex items-center gap-1 mb-1">
            <button
              type="button"
              onClick={() => {
                const currentDate = new Date(date);
                currentDate.setDate(currentDate.getDate() - 1);
                const newDate = currentDate.toISOString().split('T')[0];
                setDate(newDate);
                if (!editData) {
                  localStorage.setItem('transactionFormDate', newDate);
                }
              }}
              className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded text-xs"
            >
              ←
            </button>
            <span className="text-xs text-gray-600 flex-1 text-center">
              {(() => {
                const selectedDate = new Date(date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                selectedDate.setHours(0, 0, 0, 0);
                
                const diffTime = selectedDate.getTime() - today.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 0) return 'Today';
                if (diffDays === 1) return 'Tomorrow';
                if (diffDays === -1) return 'Yesterday';
                if (diffDays === -2) return selectedDate.toLocaleDateString('en-US', { weekday: 'short' });
                if (diffDays > 0 && diffDays <= 7) return `+${diffDays} days`;
                
                return selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  month: 'short', 
                  day: 'numeric' 
                });
              })()}
            </span>
            <button
              type="button"
              onClick={() => {
                const currentDate = new Date(date);
                currentDate.setDate(currentDate.getDate() + 1);
                const newDate = currentDate.toISOString().split('T')[0];
                setDate(newDate);
                if (!editData) {
                  localStorage.setItem('transactionFormDate', newDate);
                }
              }}
              className="px-2 py-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded text-xs"
            >
              →
            </button>
          </div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            required
          />
        </div>

        <div>
          <select
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">Label</option>
            {labels.map((l) => (
              <option key={l._id} value={l.name}>
                {l.name}
              </option>
            ))}
          </select>
          {!label && (
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
              placeholder="New label"
            />
          )}
        </div>

        <div>
          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">{type === 'expense' ? 'To' : 'By'}</option>
            {owners.map((o) => (
              <option key={o._id} value={o.name}>
                {o.name}
              </option>
            ))}
          </select>
          {!owner && (
            <input
              type="text"
              value={customOwner}
              onChange={(e) => setCustomOwner(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm mt-1"
              placeholder="New owner"
            />
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 text-white rounded text-sm font-medium transition-colors disabled:opacity-50 ${
              type === 'expense'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isSubmitting ? '...' : (editData ? 'Update' : 'Add')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
