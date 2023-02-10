import { ethers } from 'ethers';
import EscrowFactory from './artifacts/contracts/EscrowFactory.sol/EscrowFactory';
import Escrow from './artifacts/contracts/Escrow.sol/Escrow';

export async function deployEscrowContract(signer, arbiter, beneficiary, value) {
  const factory = new ethers.ContractFactory(
    Escrow.abi,
    Escrow.bytecode,
    signer
  );
  return await factory.deploy(arbiter, beneficiary, { value });
}

export function getEscrowContract(signer, address) {
  return new ethers.Contract(address, Escrow.abi, signer)
}

export async function deployFactoryContract(signer) {
  const factory = new ethers.ContractFactory(
    EscrowFactory.abi,
    EscrowFactory.bytecode,
    signer
  );
  return await factory.deploy();
}

export function getFactoryContract(signer, address) {
  return new ethers.Contract(address, EscrowFactory.abi, signer)
}