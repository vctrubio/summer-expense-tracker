import DateFilter from "./DateFilter";

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
}

export default function CalculatorSidebar({
  transactionsData,
  dateRange,
  onDateRangeChange,
  dateRangeData,
  isLoading
}: CalculatorSidebarProps) {
  return (
    <div className="space-y-4">
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
                    balance > 0 ? 'text-green-600' : 
                    balance < 0 ? 'text-red-600' : 'text-gray-700'
                  }`}>
                    ${balance.toFixed(2)}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-green-50 p-2 rounded">
                      <div className="text-green-600 font-medium">In</div>
                      <div className="text-green-700 font-bold">${totalDeposits.toFixed(2)}</div>
                    </div>
                    <div className="bg-red-50 p-2 rounded">
                      <div className="text-red-600 font-medium">Out</div>
                      <div className="text-red-700 font-bold">${totalExpenses.toFixed(2)}</div>
                    </div>
                  </div>
                  
                  {/* Mini Progress Bar */}
                  <div className="w-full bg-red-200 rounded-full h-2">
                    <div 
                      className="bg-green-400 h-2 rounded-full transition-all duration-300"
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
    </div>
  );
}