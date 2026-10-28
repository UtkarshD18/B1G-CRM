import './table-pagination.css';

function TablePagination({ label, page, pageSize, total, onPageChange, onPageSizeChange }) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const firstItem = total ? (safePage - 1) * pageSize + 1 : 0;
  const lastItem = Math.min(safePage * pageSize, total);

  return (
    <nav className="table-pagination" aria-label={`${label} pagination`}>
      <span className="table-pagination-range" aria-live="polite">
        {total ? `${firstItem}–${lastItem} of ${total}` : '0 items'}
      </span>
      <label className="table-pagination-size">
        Rows per page
        <select
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          aria-label={`${label} rows per page`}
        >
          {[5, 10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </label>
      <div className="table-pagination-actions">
        <button
          type="button"
          className="mini-button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
        >
          Previous
        </button>
        <span aria-current="page">
          Page {safePage} of {pageCount}
        </span>
        <button
          type="button"
          className="mini-button"
          disabled={safePage >= pageCount}
          onClick={() => onPageChange(safePage + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}

export default TablePagination;
