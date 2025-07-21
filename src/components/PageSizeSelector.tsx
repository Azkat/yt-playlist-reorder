import { ChevronDown } from "lucide-react";

interface PageSizeSelectorProps {
  currentPageSize: number;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;
}

const PAGE_SIZE_OPTIONS = [50]; // YouTube API制限により最大50

export default function PageSizeSelector({
  currentPageSize,
  onPageSizeChange,
  disabled = false,
}: PageSizeSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-700">表示件数:</span>
      <div className="relative">
        <select
          value={currentPageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          disabled={disabled}
          className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {PAGE_SIZE_OPTIONS.map((size) => (
            <option key={size} value={size}>
              {size}件
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}