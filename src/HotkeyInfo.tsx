interface HotkeyInfoProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HotkeyInfo({ isOpen, onClose }: HotkeyInfoProps) {
  if (!isOpen) return null;

  const hotkeys = [
    { key: 'Shift + E', description: 'Toggle expense form' },
    { key: 'Shift + D', description: 'Toggle deposit form' },
    { key: 'Shift + C', description: 'Toggle CSV import' },
    { key: 'Shift + M', description: 'Toggle manage labels/owners' },
    { key: 'Esc', description: 'Close active form/modal' },
    { key: '?', description: 'Toggle this help' },
    { key: 'Shift + Enter', description: 'Submit active form' },
    { key: 'Shift + Tab', description: 'Switch tabs in manage mode' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Keyboard Shortcuts</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {hotkeys.map((hotkey, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-600">{hotkey.description}</span>
                <kbd className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-mono">
                  {hotkey.key}
                </kbd>
              </div>
            ))}
          </div>

          <div className="mt-6 p-3 bg-gray-50 rounded text-sm text-gray-600">
            <p className="font-medium mb-1">Tips:</p>
            <ul className="text-xs space-y-1">
              <li>• Forms auto-focus on first input</li>
              <li>• Use Tab to navigate between fields</li>
              <li>• All shortcuts work globally (except when typing)</li>
              <li>• CSV format: Date, Amount, Description, Category, Name</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
