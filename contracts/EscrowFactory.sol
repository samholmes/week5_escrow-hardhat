// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "./Escrow.sol";

contract EscrowFactory {
    address[] public addresses;
    uint256 public count = 0;

    event Made(address newAddress, uint256 index);

    function makeEscrow(address _arbiter, address _beneficiary)
        external
        payable
        returns (address)
    {
        Escrow escrow = new Escrow{value: address(this).balance}(
            _arbiter,
            _beneficiary
        );
        address newAddress_ = address(escrow);
        addresses.push(newAddress_);
        emit Made(newAddress_, count++);
        return newAddress_;
    }
}
