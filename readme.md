# Decentralized Escrow Application

This is an Escrow Dapp built with [Hardhat](https://hardhat.org/).

This dapp consists only of a front-end client written in React and uses
smart-contracts as the backend to manage escrow contracts between multiple
parties.

In order to keep track of all escrow contracts, a EscrowFactory contract must
first be deployed and all instantiation of the Escrow contracts must be deployed
via the factory contract. This allows for the factory to keep track of all of
the deployed contracts so the client can use it as a persistent backend 
data layer.

The factory also acts as a faucet to distribute funds for testing.

The client interacts with each Escrow contract independently once the address is
queried from the factory contract.

The Escrow contract accepts a quorum number of arbiters in order to send funds
to the beneficiary. The arbiter list is open to registration. An arbiter may
then vote to approve the transfer of funds to the beneficiary or disapprove to
return the funds back to the depositor.

The funds in the Escrow contract are only transferred to the beneficiary if all
of the arbiters unanimously vote to approve the transfer of funds. Otherwise,
the funds always return to the depositor (even on non-unanimous votes).

If the vote is unanimous, the arbiters take a 10% fee from the funds. This 
includes approval or disapproval of the escrow agreement. However, if the votes
are non-unanimous (arbiters disagree), then the arbiters do not take a 10% fee.
This can maybe incentivize honesty?

## Project Layout

There are three top-level folders:

1. `/app` - contains the front-end application
2. `/contracts` - contains the solidity contract
3. `/tests` - contains tests for the solidity contract

## Setup

Install dependencies in the top-level directory with `npm install`.

After you have installed hardhat locally, you can use commands to test and compile the contracts, among other things. To learn more about these commands run `npx hardhat help`.

Compile the contracts using `npx hardhat compile`. The artifacts will be placed in the `/app` folder, which will make it available to the front-end. This path configuration can be found in the `hardhat.config.js` file.

## Front-End

`cd` into the `/app` directory and run `npm install`

To run the front-end application run `npm start` from the `/app` directory. Open [http://localhost:3000](http://localhost:3000) to view it in your browser.
