// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

contract Escrow {
    enum Vote {
        hmm,
        nay,
        yay
    }
    struct Arbiter {
        bool present;
        bool voted;
    }

    uint256 public quorum;
    address[] public arbiterAddresses;
    address public beneficiary;
    address public depositor;
    uint256 public funding;
    string public requirement;

    bool public isSettled;
    uint256 yays;
    uint256 nays;

    mapping(address => Arbiter) public arbiters;
    uint256 voteCount;

    constructor(
        uint256 _quorum,
        address _beneficiary,
        string memory _requirement
    ) payable {
        quorum = _quorum;
        beneficiary = _beneficiary;
        depositor = tx.origin;
        funding = msg.value;
        requirement = _requirement;
    }

    event Settled(uint256 funds, address recipient);
    event Retracted(uint256 funds, address recipient);

    function arbitrate() external {
        require(arbiterAddresses.length < quorum, "Cannot exceed quorum");
        arbiterAddresses.push(msg.sender);
        arbiters[msg.sender].present = true;
    }

    function approve() external onlyArbiters hasNotVoted notSettled {
        arbiters[msg.sender].voted = true;
        ++yays;
        ++voteCount;

        if (everyoneHasVoted()) {
            settle();
        }
    }

    function disapprove() external onlyArbiters hasNotVoted notSettled {
        arbiters[msg.sender].voted = true;
        ++nays;
        ++voteCount;

        if (everyoneHasVoted()) {
            settle();
        }
    }

    function settle() internal {
        Vote consensus = getConsensusVote();
        isSettled = true;
        if (consensus == Vote.yay) {
            uint256 fee = (funding / 10);
            payoutArbiters(fee);
            (bool sentFunds, ) = payable(beneficiary).call{
                value: funding - fee
            }("");
            require(sentFunds, "Failed to send funds to beneficiary");
            emit Settled(funding, beneficiary);
        }
        if (consensus == Vote.nay) {
            uint256 fee = (funding / 10);
            payoutArbiters(fee);
            (bool sentFunds, ) = payable(depositor).call{value: funding - fee}(
                ""
            );
            require(sentFunds, "Failed to send funds to depositor");
            emit Settled(funding, depositor);
        }
        if (consensus == Vote.hmm) {
            (bool sent, ) = payable(depositor).call{value: funding}("");
            require(sent, "Failed to return funds to depositor");
            emit Retracted(funding, depositor);
        }
    }

    function payoutArbiters(uint256 fee) internal {
        for (uint256 i = 0; i < arbiterAddresses.length; ++i) {
            (bool sentFee, ) = payable(arbiterAddresses[i]).call{
                value: fee / arbiterAddresses.length
            }("");
            require(sentFee, "Failed to send fee");
        }
    }

    function everyoneHasVoted() internal view returns (bool) {
        return voteCount == quorum;
    }

    function getConsensusVote() internal view returns (Vote) {
        if (nays > 0 && yays == 0) {
            return Vote.nay;
        }
        if (yays > 0 && nays == 0) {
            return Vote.yay;
        }
        return Vote.hmm;
    }

    modifier onlyArbiters() {
        require(arbiters[msg.sender].present, "Must be an registered arbiter");
        _;
    }

    modifier hasNotVoted() {
        require(!arbiters[msg.sender].voted, "Already voted");
        _;
    }

    modifier notSettled() {
        require(!isSettled, "Contract has already been settled");
        _;
    }
}
