import './Pagination.css';

/**
 * Reusable pagination component for navigating through paginated data
 *
 * @param {Object} props
 * @param {number} props.currentPage - Current active page (1-based index)
 * @param {number} props.totalPages - Total number of pages
 * @param {Function} props.onPageChange - Callback when page changes
 * @param {string} [props.className] - Additional CSS classes
 * @param {boolean} [props.showFirstLast=true] - Show first/last page buttons
 * @param {number} [props.siblingCount=1] - Number of page buttons to show on each side of current
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className = '',
  showFirstLast = true,
  siblingCount = 1
}) {
  if (totalPages <= 1) {
    return null;
  }

  /**
   * Generates the range of page numbers to display
   * @returns {Array<number|string>} Array of page numbers and '...' for gaps
   */
  const getPageNumbers = () => {
    const pageNumbers = [];
    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    // Always show first page
    if (showFirstLast || currentPage > siblingCount + 1) {
      pageNumbers.push(1);
    }

    // Left ellipsis
    if (showLeftEllipsis) {
      pageNumbers.push('...');
    }

    // Page numbers around current page
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i !== 1 && i !== totalPages) {
        pageNumbers.push(i);
      }
    }

    // Right ellipsis
    if (showRightEllipsis) {
      pageNumbers.push('...');
    }

    // Always show last page
    if (showFirstLast || currentPage < totalPages - siblingCount) {
      pageNumbers.push(totalPages);
    }

    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  const handlePrevious = () => {
    if (!isFirstPage) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (!isLastPage) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    if (typeof page === 'number' && page !== currentPage) {
      onPageChange(page);
    }
  };

  return (
    <div className={`pagination ${className}`}>
      <button
        className="pagination-button pagination-prev"
        onClick={handlePrevious}
        disabled={isFirstPage}
        aria-label="Previous page"
      >
        ← Previous
      </button>

      <div className="pagination-numbers">
        {pageNumbers.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                ...
              </span>
            );
          }

          return (
            <button
              key={page}
              className={`pagination-number ${page === currentPage ? 'active' : ''}`}
              onClick={() => handlePageClick(page)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}
      </div>

      <button
        className="pagination-button pagination-next"
        onClick={handleNext}
        disabled={isLastPage}
        aria-label="Next page"
      >
        Next →
      </button>
    </div>
  );
}
