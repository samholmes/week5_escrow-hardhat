export default function Escrow({
  address,
  arbiter,
  beneficiary,
  value,
  isApproved,
  handleApprove,
}) {
  return (
    <div className="existingContracts">
      <ul className="fields">
        <li>
          <div> Arbiter </div>
          <div> {arbiter} </div>
        </li>
        <li>
          <div> Beneficiary </div>
          <div> {beneficiary} </div>
        </li>
        <li>
          <div> Value </div>
          <div> {value} </div>
        </li>
          <button
            id={address}
            onClick={(e) => {
              e.preventDefault();

              handleApprove();
            }}
            disabled={isApproved}
          >
            {isApproved ? "✓ It's been approved!" : 'Approve'}
          </button>
      </ul>
    </div>
  );
}
