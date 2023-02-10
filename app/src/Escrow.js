export default function Escrow(props) {
  const { escrow, account } = props
  const {
    address,
    arbiters,
    beneficiary,
    depositor,
    funding,
    isSettled,
    onArbitrate,
    onApprove,
    onDisapprove,
    quorum,
  } = escrow
  const isArbiter = arbiters.some(arb => arb.address.toLowerCase() === account.toLowerCase())
  const hasVoted = arbiters.some(arb => arb.address.toLowerCase() === account.toLowerCase() && arb.voted)

  console.log({
    isArbiter,
    hasVoted
  })

  const handleArbitrate = (e) => {
    e.preventDefault();
    onArbitrate();
  }
  const handleApprove = (e) => {
    e.preventDefault();
    onApprove();
  }
  const handleDisapprove = (e) => {
    e.preventDefault();
    onDisapprove();
  }

  return (
    <div className="existingContracts">
      <ul className="fields">
        <div className="field">
          <label> Arbiters ({arbiters.length}/{quorum}) </label>
          <ul>
            {arbiters.map(arb => {
              return <li>{arb.address}</li>
            })}
          </ul>
        </div>
        <div className="field">
          <label> Beneficiary </label>
          <span> {beneficiary} </span>
        </div>
        <div className="field">
          <label> Depositor </label>
          <span> {depositor} </span>
        </div>
        <div className="field">
          <label> Funding </label>
          <span> {funding} </span>
        </div>
        {
        isSettled 
          ? 
            <button
              id={address}
              disabled
            >
              ✓ It's been settled!
            </button>
          : isArbiter && !hasVoted
            ?
              <>
                <button
                  id={address}
                  onClick={handleApprove}
                >
                  Approve
                </button>
                <button
                  id={address}
                  onClick={handleDisapprove}
                >
                  Disapprove
                </button>
              </>
            : hasVoted
              ?
                <button
                  id={address}
                  disabled
                >
                  Waiting for other arbiters...
                </button>
              :
                <button
                  id={address}
                  onClick={handleArbitrate}
                >
                  Arbitrate
                </button>
        }
      </ul>
    </div>
  );
}
