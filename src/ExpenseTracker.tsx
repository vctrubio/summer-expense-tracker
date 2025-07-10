import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import TransactionForm from "./TransactionForm";
import TransactionList from "./TransactionList";
import ManageLabelsOwners from "./ManageLabelsOwners";
import CSVImport from "./CSVImport";
import HotkeyInfo from "./HotkeyInfo";
import QuickActionsBar from "./QuickActionsBar";
import CalculatorSidebar from "./CalculatorSidebar";

export default function ExpenseTracker() {
  // Initialize date range from URL params
  const [dateRange, setDateRange] = useState<{
    start: number;
    end: number;
  } | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const start = params.get("start");
    const end = params.get("end");
    if (start && end) {
      return {
        start: parseInt(start),
        end: parseInt(end),
      };
    }
    return null;
  });

  // Initialize filters from URL params
  const [filters, setFilters] = useState<{
    type?: 'expense' | 'deposit';
    label?: string;
    owner?: string;
    sortBy?: 'date' | 'highest' | 'lowest';
  }>(() => {
    const params = new URLSearchParams(window.location.search);
    const filters: any = {};
    const type = params.get("type");
    const label = params.get("label");
    const owner = params.get("owner");
    const sortBy = params.get("sortBy");
    
    if (type && (type === 'expense' || type === 'deposit')) filters.type = type;
    if (label) filters.label = label;
    if (owner) filters.owner = owner;
    if (sortBy && ['date', 'highest', 'lowest'].includes(sortBy)) filters.sortBy = sortBy;
    
    return filters;
  });
  const [activeForm, setActiveForm] = useState<
    "expense" | "deposit" | "manage" | "csv" | null
  >(null);
  const [showHotkeys, setShowHotkeys] = useState(false);
  const [editData, setEditData] = useState<{
    id: string;
    type: "expense" | "deposit";
    amount: number;
    desc: string;
    label: string;
    owner?: string;
    timestamp: number;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [transactionsData, setTransactionsData] = useState<{
    expenses: any[];
    deposits: any[];
  } | null>(null);

  const queryData = useQuery(
    api.expenses.list,
    dateRange
      ? {
          startDate: dateRange.start,
          endDate: dateRange.end,
        }
      : {},
  );

  const dateRangeData = useQuery(api.expenses.getDateRange);
  const labels = useQuery(api.labels.list) || [];
  const owners = useQuery(api.owners.list) || [];

  useEffect(() => {
    if (queryData !== undefined) {
      setTransactionsData(queryData);
      setIsLoading(false);
    }
  }, [queryData]);

  // Global hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case "e":
          if (e.shiftKey) {
            e.preventDefault();
            setActiveForm(activeForm === "expense" ? null : "expense");
          }
          break;
        case "d":
          if (e.shiftKey) {
            e.preventDefault();
            setActiveForm(activeForm === "deposit" ? null : "deposit");
          }
          break;
        case "m":
          if (e.shiftKey) {
            e.preventDefault();
            setActiveForm(activeForm === "manage" ? null : "manage");
          }
          break;
        case "c":
          if (e.shiftKey) {
            e.preventDefault();
            setActiveForm(activeForm === "csv" ? null : "csv");
          }
          break;
        case "escape":
          e.preventDefault();
          setActiveForm(null);
          break;
        case "?":
          e.preventDefault();
          setShowHotkeys(!showHotkeys);
          break;
        case "x":
          e.preventDefault();
          // Focus is handled by the ExportMenu component
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeForm, showHotkeys]);

  const handleEdit = (transaction: {
    id: string;
    type: "expense" | "deposit";
    amount: number;
    desc: string;
    label: string;
    owner?: string;
    timestamp: number;
  }) => {
    setEditData(transaction);
    setActiveForm(transaction.type);
  };

  const handleCloseForm = () => {
    setActiveForm(null);
    setEditData(null);
  };

  const handleDateRangeChange = (
    range: { start: number; end: number } | null,
  ) => {
    setIsLoading(true);
    setDateRange(range);

    // Update URL params
    const url = new URL(window.location.href);
    if (range) {
      url.searchParams.set("start", range.start.toString());
      url.searchParams.set("end", range.end.toString());
    } else {
      url.searchParams.delete("start");
      url.searchParams.delete("end");
    }
    window.history.replaceState({}, "", url.toString());
  };

  const handleFilterChange = (newFilters: {
    type?: 'expense' | 'deposit';
    label?: string;
    owner?: string;
    sortBy?: 'date' | 'highest' | 'lowest';
  }) => {
    setFilters(newFilters);

    // Update URL params
    const url = new URL(window.location.href);
    
    // Clear existing filter params
    url.searchParams.delete("type");
    url.searchParams.delete("label");
    url.searchParams.delete("owner");
    url.searchParams.delete("sortBy");
    
    // Set new filter params
    if (newFilters.type) url.searchParams.set("type", newFilters.type);
    if (newFilters.label) url.searchParams.set("label", newFilters.label);
    if (newFilters.owner) url.searchParams.set("owner", newFilters.owner);
    if (newFilters.sortBy) url.searchParams.set("sortBy", newFilters.sortBy);
    
    window.history.replaceState({}, "", url.toString());
  };

  const hasTransactions =
    transactionsData &&
    (transactionsData.expenses.length > 0 ||
      transactionsData.deposits.length > 0);

  // Extract common form components for DRY
  const renderForms = () => (
    <>
      <TransactionForm
        type="expense"
        isOpen={activeForm === "expense"}
        onClose={handleCloseForm}
        editData={editData?.type === "expense" ? editData : undefined}
      />
      <TransactionForm
        type="deposit"
        isOpen={activeForm === "deposit"}
        onClose={handleCloseForm}
        editData={editData?.type === "deposit" ? editData : undefined}
      />
      <CSVImport
        isOpen={activeForm === "csv"}
        onClose={() => setActiveForm(null)}
        labels={labels}
        owners={owners}
      />
      <ManageLabelsOwners
        isOpen={activeForm === "manage"}
        onClose={() => setActiveForm(null)}
      />
      <HotkeyInfo isOpen={showHotkeys} onClose={() => setShowHotkeys(false)} />
    </>
  );

  if (isLoading && !transactionsData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (!hasTransactions && !dateRange) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <QuickActionsBar
            activeForm={activeForm}
            setActiveForm={setActiveForm}
            setShowHotkeys={setShowHotkeys}
            showHotkeys={showHotkeys}
            data={transactionsData}
            dateRange={dateRange}
          />

          <div className="mt-6">
            {renderForms()}

            <div className="text-center py-16">
              <div className="text-4xl mb-4">💰</div>
              <h2 className="text-xl font-medium text-gray-800 mb-2">
                No transactions yet
              </h2>
              <p className="text-gray-600 mb-8">
                Press{" "}
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">E</kbd>{" "}
                for expense,
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm ml-1">
                  D
                </kbd>{" "}
                for deposit,
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm ml-1">
                  C
                </kbd>{" "}
                for CSV import, or
                <kbd className="px-2 py-1 bg-gray-100 rounded text-sm ml-1">
                  ?
                </kbd>{" "}
                for help
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quick Actions Bar */}
        <QuickActionsBar
          activeForm={activeForm}
          setActiveForm={setActiveForm}
          setShowHotkeys={setShowHotkeys}
          showHotkeys={showHotkeys}
          data={transactionsData}
          dateRange={dateRange}
        />

        {/* Main Layout: Forms + Content Grid */}
        <div className="mt-6 space-y-6">
          {/* Inline Forms */}
          {renderForms()}

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Main Content */}
            <div className="lg:col-span-2 space-y-6">
              <TransactionList
                data={transactionsData}
                onEdit={handleEdit}
                isLoading={isLoading}
                filters={filters}
              />
            </div>

            {/* Right: Calculator Sidebar */}
            <div className="lg:col-span-1">
              <CalculatorSidebar
                transactionsData={transactionsData}
                dateRange={dateRange}
                onDateRangeChange={handleDateRangeChange}
                dateRangeData={dateRangeData}
                isLoading={isLoading}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
