import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface ManageLabelsOwnersProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageLabelsOwners({ isOpen, onClose }: ManageLabelsOwnersProps) {
  const [activeTab, setActiveTab] = useState<'labels' | 'owners'>('labels');
  const [newLabel, setNewLabel] = useState('');
  const [newOwner, setNewOwner] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const labels = useQuery(api.labels.list) || [];
  const owners = useQuery(api.owners.list) || [];
  
  const addLabel = useMutation(api.labels.add);
  const removeLabel = useMutation(api.labels.remove);
  const addOwner = useMutation(api.owners.add);
  const removeOwner = useMutation(api.owners.remove);

  // Focus input when form opens or tab changes
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, activeTab]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        setActiveTab(activeTab === 'labels' ? 'owners' : 'labels');
      } else if ((e.key === 'Enter' && (e.shiftKey || e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        if (activeTab === 'labels') {
          handleAddLabel(e as any);
        } else {
          handleAddOwner(e as any);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, activeTab, newLabel, newOwner]);

  const handleAddLabel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    try {
      await addLabel({ name: newLabel.trim() });
      setNewLabel('');
      toast.success('Label added');
    } catch (error) {
      toast.error('Failed to add label');
    }
  };

  const handleAddOwner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOwner.trim()) return;

    try {
      await addOwner({ name: newOwner.trim() });
      setNewOwner('');
      toast.success('Owner added');
    } catch (error) {
      toast.error('Failed to add owner');
    }
  };

  const handleRemoveLabel = async (id: string) => {
    try {
      await removeLabel({ id: id as any });
      toast.success('Label removed');
    } catch (error) {
      toast.error('Failed to remove label');
    }
  };

  const handleRemoveOwner = async (id: string) => {
    try {
      await removeOwner({ id: id as any });
      toast.success('Owner removed');
    } catch (error) {
      toast.error('Failed to remove owner');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-800">Manage Labels & Owners</h3>
        <div className="text-xs text-gray-500">
          <kbd className="px-1 py-0.5 bg-gray-100 rounded">Shift+Tab</kbd> to switch, <kbd className="px-1 py-0.5 bg-gray-100 rounded">Shift+Enter</kbd> to add, <kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> to close
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-4">
        <button
          onClick={() => setActiveTab('labels')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'labels'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Labels ({labels.length})
        </button>
        <button
          onClick={() => setActiveTab('owners')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'owners'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-800'
          }`}
        >
          Owners ({owners.length})
        </button>
      </div>

      {/* Labels Tab */}
      {activeTab === 'labels' && (
        <div className="space-y-3">
          <form onSubmit={handleAddLabel} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Add new label"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </form>

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {labels.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No labels yet</p>
            ) : (
              labels.map((label) => (
                <div key={label._id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm">{label.name}</span>
                  <button
                    onClick={() => handleRemoveLabel(label._id)}
                    className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Owners Tab */}
      {activeTab === 'owners' && (
        <div className="space-y-3">
          <form onSubmit={handleAddOwner} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              placeholder="Add new owner"
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
          </form>

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {owners.length === 0 ? (
              <p className="text-gray-500 text-sm py-4 text-center">No owners yet</p>
            ) : (
              owners.map((owner) => (
                <div key={owner._id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <span className="text-sm">{owner.name}</span>
                  <button
                    onClick={() => handleRemoveOwner(owner._id)}
                    className="text-red-600 hover:text-red-800 text-xs px-2 py-1 rounded hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
