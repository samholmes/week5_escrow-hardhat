import { ethers } from 'ethers';
import EscrowFactory from './artifacts/contracts/EscrowFactory.sol/EscrowFactory';
import Escrow from './artifacts/contracts/Escrow.sol/Escrow';

export async function deployEscrow(signer, arbiter, beneficiary, value) {
  const factory = new ethers.ContractFactory(
    Escrow.abi,
    Escrow.bytecode,
    signer
  );
  return await factory.deploy(arbiter, beneficiary, { value });
}

export function getEscrow(signer, address) {
  return new ethers.Contract(address, Escrow.abi, signer)
}

export async function deployFactory(signer) {
  const factory = new ethers.ContractFactory(
    EscrowFactory.abi,
    EscrowFactory.bytecode,
    signer
  );
  return await factory.deploy();
}

export function getFactory(signer, address) {
  return new ethers.Contract(address, EscrowFactory.abi, signer)
}