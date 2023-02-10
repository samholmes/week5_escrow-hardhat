import { ethers } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import { getEscrowContract, deployFactoryContract, getFactoryContract } from './contractHelpers';
import Escrow from './Escrow';
import { useHandler } from './hooks/useHandler';

const provider = new ethers.providers.Web3Provider(window.ethereum);

function App() {
  const [account, setAccount] = useState();
  const [contractCount, setContractCount] = useState(0);
  const [escrows, setEscrows] = useState([]);
  const [factoryContractAddress, setFactoryContractAddress] = useState(localStorage.getItem('factoryContractAddress'))
  const [signer, setSigner] = useState();

  const factoryContract = useMemo(() => {
    return factoryContractAddress ? getFactoryContract(signer, factoryContractAddress) : null
  }, [factoryContractAddress, signer])

  useEffect(() => {
    const handler = (accounts) => {
      setAccount(accounts[0])
    }
    window.ethereum.on('accountsChanged', handler)
    provider.send('eth_requestAccounts', []).then(handler)
    return () => {
      window.ethereum.removeListener('accountsChanged', handler)
    }
  }, []);

  useEffect(() => {
    setSigner(provider.getSigner())
  }, [account]);

  useEffect(() => {
    const effect = async () => {
      const count = await factoryContract.count()
      setContractCount(count.toNumber())
    }
    effect()
  }, [factoryContract])

  const getEscrow = useHandler(async (address) => {
    const escrowContract = getEscrowContract(signer, address)
    const quorum = (await escrowContract.quorum()).toNumber()
    const arbiters = []
    for (let i = 0; i < quorum; ++i) {
      const arbiterAddress = await escrowContract.arbiterAddresses(i).catch(_ => null);
      const arbiter = await escrowContract.arbiters(arbiterAddress).catch(_ => null);
      // arbiters
      if (arbiterAddress != null)
        arbiters.push({
          address: arbiterAddress,
          voted: arbiter.voted
        });
    }
    const beneficiary = await escrowContract.beneficiary()
    const depositor = await escrowContract.depositor()
    const isSettled = await escrowContract.isSettled()
    const funding = await escrowContract.funding()

    escrowContract.on('Settled', () => {
      setEscrows(escrows => {
        return escrows.map(escrow => {
          if (escrow.address === address) {
            return {...escrow, isSettled: true }
          }
          return escrow
        })
      })
    });
    escrowContract.on('Retracted', () => {
      setEscrows(escrows => {
        return escrows.map(escrow => {
          if (escrow.address === address) {
            return {...escrow, isSettled: true }
          }
          return escrow
        })
      })
    });

    const updateEscrow = async () => {
      const newEscrow = await getEscrow(address)
      setEscrows(escrows => {
        return escrows.map(escrow => {
          if (escrow.address === newEscrow.address) {
            return newEscrow
          }
          return escrow
        })
      })
    }
    
    return {
      address,
      arbiters,
      beneficiary,
      depositor,
      isSettled,
      funding: ethers.utils.formatUnits(funding, 'ether'),
      quorum,
      onArbitrate: async () => {
        const approveTxn = await escrowContract.connect(signer).arbitrate();
        await approveTxn.wait();
        await updateEscrow()
      },
      onApprove: async () => {
        const approveTxn = await escrowContract.connect(signer).approve();
        await approveTxn.wait();
        await updateEscrow()
      },
      onDisapprove: async () => {
        const approveTxn = await escrowContract.connect(signer).disapprove();
        await approveTxn.wait();
        await updateEscrow()
      },
    };
  })
  const getEscrows = useHandler(async () => {
    const escrows = []
    try {
      for (let i = 0; i < contractCount; ++i) {
        const address = await factoryContract.addresses(i)
        const escrow = await getEscrow(address)
        escrows.push(escrow)
      }
    } catch (error) {
      console.error(error)
    }
    return escrows.reverse()
  })

  useEffect(() => {
    if (factoryContract != null && signer != null) {
      getEscrows().then(escrows => setEscrows(escrows))
    }
  }, [contractCount, factoryContract, getEscrows, signer])

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const quorum = document.getElementById('quorum').value;
    const amount = document.getElementById('amount').value;
    const value = ethers.utils.parseEther(amount)
    const makeEscrowTx = await factoryContract.makeEscrow(quorum, beneficiary, { value })
    const makeEscrowReceipt = await makeEscrowTx.wait();

    const event = makeEscrowReceipt.events.find(event => event.event === 'Made')

    if (event != null) {
      const [, index] = event.args
      setContractCount(index.toNumber() + 1)
    }
  }

  const handleClickClearFactory = async (ev) => {
      localStorage.removeItem('factoryContractAddress')
      setFactoryContractAddress(null)
  }
  const handleClickDeployFactory = async (ev) => {
    try {
      const factory = await deployFactoryContract(signer);
      localStorage.setItem('factoryContractAddress', factory.address)
      setFactoryContractAddress(factory.address)
    } catch (error) {
      console.error(error)
    }
  }

  const handleSubmit = (ev) => {
    ev.preventDefault();
    newContract();
  }

  if (factoryContract == null) return (
    <div className='pageContainer'>
      <p>To begin, you must deploy a factory contract.</p>
      <button onClick={handleClickDeployFactory}>Deploy Factory Contract</button>
    </div>
  )

  return (
    <div className="pageContainer">
      <div>
        Account: {account}
      </div>
      <div>
        Factory Contract: {factoryContract.address}
      </div>
      <div>
        <button onClick={handleClickClearFactory}>Exit Factory Contract </button>
      </div>
      <section>
        <form onSubmit={handleSubmit}>
          <h1> New Contract </h1>
          <label>
            Beneficiary Address
            <input type="text" id="beneficiary" defaultValue="0x70997970C51812dc3A010C7d01b50e0d17dc79C8" />
          </label>

          <label>
            Quorum
            <input type="number" id="quorum" defaultValue={1} min={1} max={6} />
          </label>

          <label>
            Deposit Amount
            <input type="number" id="amount" defaultValue={1} min={0.000000000000000001} />
          </label>

          <button>
            Deploy
          </button>
        </form>
      </section>

      <section>
        <h1> Existing Contracts </h1>
        <div id="container">
          {escrows.length === 0 ? <p>No Escrow Contracts in Affect.</p> : null}
          {escrows.map((escrow) => {
            return <Escrow key={escrow.address} escrow={escrow} account={account} />;
          })}
        </div>
      </section>
    </div>
  );
}

export default App;
