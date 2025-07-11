import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { toast } from "sonner";

interface ManageOwnersProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ManageOwners({ isOpen, onClose }: ManageOwnersProps) {
  const [newOwner, setNewOwner] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  const owners = useQuery(api.owners.list) || [];
  
  const addOwner = useMutation(api.owners.add);
  const removeOwner = useMutation(api.owners.remove);

  // Focus input when form opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if ((e.key === 'Enter' && (e.shiftKey || e.metaKey || e.ctrlKey))) {
        e.preventDefault();
        handleAddOwner(e as any);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, newOwner]);


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
        <h3 className="font-medium text-gray-800">Manage Owners</h3>
        <div className="text-xs text-gray-500">
          <kbd className="px-1 py-0.5 bg-gray-100 rounded">Shift+Enter</kbd> to add, <kbd className="px-1 py-0.5 bg-gray-100 rounded">Esc</kbd> to close
        </div>
      </div>

      {/* Owners Management */}
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
    </div>
  );
}
