export default function Escrow(props) {
  const { escrow, account } = props
  const {
    address,
    arbiter,
    beneficiary,
    funding,
    isApproved,
    handleApprove,
  } = escrow
  const canApprove = account.toLowerCase() === arbiter.toLowerCase()


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
          <div> Funding </div>
          <div> {funding} </div>
        </li>
        {!canApprove && !isApproved ? null :
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
        }
      </ul>
    </div>
  );
}
