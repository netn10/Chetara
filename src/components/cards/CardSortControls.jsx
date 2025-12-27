import { SORT_DIRECTION } from '../../utils/sortUtils';
import './CardSortControls.css';

/**
 * CardSortControls component - Renders sort dropdowns and controls
 *
 * @param {Object} props
 * @param {Array} props.sortCriteria - Array of sort criteria objects
 * @param {Function} props.onAddCriterion - Handler for adding sort criterion
 * @param {Function} props.onUpdateCriterion - Handler for updating sort criterion
 * @param {Function} props.onRemoveCriterion - Handler for removing sort criterion
 * @param {boolean} props.hasMultipleCriteria - Whether multiple criteria are active
 */
export default function CardSortControls({
  sortCriteria,
  onAddCriterion,
  onUpdateCriterion,
  onRemoveCriterion,
  hasMultipleCriteria
}) {
  return (
    <div className="sort-section">
      <div className="sort-header">
        <label className="sort-label">Sort By:</label>
        <button
          className="add-sort-btn"
          onClick={onAddCriterion}
          title="Add another sort criterion"
        >
          + Add Sort
        </button>
      </div>

      {sortCriteria.map((criterion, index) => (
        <div key={index} className="sort-controls">
          <span className="sort-priority">{index + 1}.</span>

          <select
            value={criterion.field}
            onChange={(e) => onUpdateCriterion(index, 'field', e.target.value)}
            className="sort-select"
          >
            <option value="name">Name</option>
            <option value="manaCost">Mana Cost</option>
            <option value="rarity">Rarity</option>
            <option value="type">Type</option>
            <option value="color">Color Count</option>
            <option value="custom">Custom Status</option>
          </select>

          <div className="sort-order-toggle">
            <button
              className={`sort-order-btn ${criterion.order === SORT_DIRECTION.ASC ? 'active' : ''}`}
              onClick={() => onUpdateCriterion(index, 'order', SORT_DIRECTION.ASC)}
              title="Ascending order"
            >
              ↑ Asc
            </button>
            <button
              className={`sort-order-btn ${criterion.order === SORT_DIRECTION.DESC ? 'active' : ''}`}
              onClick={() => onUpdateCriterion(index, 'order', SORT_DIRECTION.DESC)}
              title="Descending order"
            >
              ↓ Desc
            </button>
          </div>

          {hasMultipleCriteria && (
            <button
              className="remove-sort-btn"
              onClick={() => onRemoveCriterion(index)}
              title="Remove this sort criterion"
            >
              ✕
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
