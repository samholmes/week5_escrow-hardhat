const { ethers } = require('hardhat');
const { expect } = require('chai');

describe('Escrow', function () {
  const arbiterCount = 3
  const deposit = ethers.utils.parseEther('1');

  let arbiters = [];
  let contract;
  let depositor;
  let beneficiary;
  let other;

  beforeEach(async () => {
    let signerIndex = 0
    depositor = ethers.provider.getSigner(signerIndex++);
    beneficiary = ethers.provider.getSigner(signerIndex++);
    other = ethers.provider.getSigner(signerIndex++)
    arbiters = []
    for (let i = 0; i < arbiterCount; ++i) {
      arbiters.push(ethers.provider.getSigner(signerIndex++))
    }
    const Escrow = await ethers.getContractFactory('Escrow');
    contract = await Escrow.deploy(
      arbiterCount,
      beneficiary.getAddress(),
      {
        value: deposit,
      }
    );
    await contract.deployed();
  });

  it('should be funded initially', async function () {
    let balance = await ethers.provider.getBalance(contract.address);
    expect(balance).to.eq(deposit);
  });

  it('will allow arbiter registration', async function() {
    for (let i = 0; i < arbiterCount; ++i) {
      const tx = await contract.connect(arbiters[i]).arbitrate()
      await tx.wait(1)
    }
  })
  it('wont allow over-registration', async function() {
    for (let i = 0; i < arbiterCount; ++i) {
      const tx = await contract.connect(arbiters[i]).arbitrate()
      await tx.wait(1)
    }
    await expect(contract.connect(other).arbitrate()).to.be.revertedWith('Cannot exceed quorum')
  })


  it('will only allow arbiters to approve', async () => {
    for (let i = 0; i < arbiterCount; ++i) {
      const tx = await contract.connect(arbiters[i]).arbitrate()
      await tx.wait(1)
    }
    await expect(contract.connect(other).approve()).to.be.reverted;
  });

  it('will only allow arbiters to disapprove', async () => {
    for (let i = 0; i < arbiterCount; ++i) {
      const tx = await contract.connect(arbiters[i]).arbitrate()
      await tx.wait(1)
    }
    await expect(contract.connect(other).disapprove()).to.be.reverted;
  });

  it('wont allow approve/disapprove on settled contract', async () => {
    for (let i = 0; i < arbiterCount; ++i) {
      await (await contract.connect(arbiters[i]).arbitrate()).wait();
      await (await contract.connect(arbiters[i]).approve()).wait();
    }
    await expect(contract.connect(arbiters[0]).approve()).to.be.revertedWith('Already voted');
    await expect(contract.connect(arbiters[0]).disapprove()).to.be.revertedWith('Already voted');
  });
  
  it('will allow arbiters to approve and contract is settled with funds transferred', async () => {
    const before = await ethers.provider.getBalance(beneficiary.getAddress());
    for (let i = 0; i < arbiterCount; ++i) {
      await (await contract.connect(arbiters[i]).arbitrate()).wait();
      await (await contract.connect(arbiters[i]).approve()).wait();
    }
    const after = await ethers.provider.getBalance(beneficiary.getAddress());
    expect(after.sub(before)).to.eq(deposit.mul(9).div(10));
  });

  it('will allow arbiters to disapprove and contract is settled with funds returned', async () => {
    const before = await ethers.provider.getBalance(depositor.getAddress());
    for (let i = 0; i < arbiterCount; ++i) {
      await (await contract.connect(arbiters[i]).arbitrate()).wait();
      await (await contract.connect(arbiters[i]).disapprove()).wait();
    }
    const after = await ethers.provider.getBalance(depositor.getAddress());
    expect(after.sub(before)).to.eq(deposit.mul(9).div(10));
  });

  it('will allow arbiters to disagree and contract is retracted with funds returned', async () => {
    const before = await ethers.provider.getBalance(depositor.getAddress());
    for (let i = 0; i < arbiterCount; ++i) {
      await (await contract.connect(arbiters[i]).arbitrate()).wait();
      if (i % 2 === 0) {
        await (await contract.connect(arbiters[i]).approve()).wait();
      }
      else {
        await (await contract.connect(arbiters[i]).disapprove()).wait();
      }
    }
    const after = await ethers.provider.getBalance(depositor.getAddress());
    expect(after.sub(before)).to.eq(deposit);
  });
});
