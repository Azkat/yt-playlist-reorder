import { CheckCircle, X } from "lucide-react";

interface SuccessMessageProps {
  show: boolean;
  onClose: () => void;
  message?: string;
}

export default function SuccessMessage({ 
  show, 
  onClose, 
  message = "Changes applied successfully!" 
}: SuccessMessageProps) {
  if (!show) return null;

  return (
    <div className="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg max-w-sm">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-900">
              Success!
            </p>
            <p className="text-sm text-green-700">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-green-400 hover:text-green-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}