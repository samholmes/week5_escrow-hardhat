// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./Escrow.sol";

contract EscrowFactory {
    address[] public addresses;
    uint256 public count = 0;

    event Made(address newAddress, uint256 index);

    receive() external payable {}

    function makeEscrow(uint256 _arbiterCount, address _beneficiary)
        external
        payable
        returns (address)
    {
        Escrow escrow = new Escrow{value: address(this).balance}(
            _arbiterCount,
            _beneficiary
        );
        address newAddress_ = address(escrow);
        addresses.push(newAddress_);
        emit Made(newAddress_, count++);
        return newAddress_;
    }

    function faucet() external {
        uint256 faucetFunds = address(this).balance / 10;
        require(faucetFunds > 0, "Faucet is dry");
        uint256 amount = faucetFunds;
        (bool s, ) = payable(msg.sender).call{value: amount}("");
        require(s);
    }
}
