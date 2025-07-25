import Pagination from "./Pagination";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;
  hasNextPageToken?: boolean;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  hasNextPageToken = false,
}: PaginationControlsProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-3 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        {/* 左側: 結果情報 */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6">
          <div className="text-sm text-gray-700">
            {totalItems > 0 ? (
              <span>
                {startItem}-{endItem} of {totalItems} items ({pageSize} per page)
              </span>
            ) : (
              <span>0 items</span>
            )}
          </div>
        </div>

        {/* 右側: ページネーション */}
        <div className="flex justify-center sm:justify-end">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
            disabled={disabled}
            hasNextPageToken={hasNextPageToken}
          />
        </div>
      </div>
    </div>
  );
}