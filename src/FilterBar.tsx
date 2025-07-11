import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface FilterBarProps {
  filters: {
    type?: 'expense' | 'deposit';
    owner?: string;
    sortBy?: 'date' | 'highest' | 'lowest';
  };
  onFilterChange: (filters: {
    type?: 'expense' | 'deposit';
    owner?: string;
    sortBy?: 'date' | 'highest' | 'lowest';
  }) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const owners = useQuery(api.owners.list) || [];

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters };
    if (value === '') {
      delete newFilters[key as keyof typeof newFilters];
    } else {
      (newFilters as any)[key] = value;
    }
    onFilterChange(newFilters);
  };

  const clearAllFilters = () => {
    onFilterChange({});
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            Clear All
          </button>
        )}
      </div>
      
      <div className="space-y-3">
        {/* Type Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Type</label>
          <select
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All</option>
            <option value="expense">Expenses</option>
            <option value="deposit">Deposits</option>
          </select>
        </div>


        {/* Owner Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Owner</label>
          <select
            value={filters.owner || ''}
            onChange={(e) => handleFilterChange('owner', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Owners</option>
            {owners.map((owner) => (
              <option key={owner._id} value={owner.name}>
                {owner.name}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sort By</label>
          <select
            value={filters.sortBy || 'date'}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="date">Date (Newest)</option>
            <option value="highest">Highest Amount</option>
            <option value="lowest">Lowest Amount</option>
          </select>
        </div>
      </div>
    </div>
  );
}