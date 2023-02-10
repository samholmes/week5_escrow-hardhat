import { ethers } from 'ethers';
import { useEffect, useMemo, useState } from 'react';
import { getEscrow, deployFactory, getFactory } from './contractHelpers';
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
    return factoryContractAddress ? getFactory(signer, factoryContractAddress) : null
  }, [factoryContractAddress, signer])

  useEffect(() => {
    async function getAccounts() {
      const accounts = await provider.send('eth_requestAccounts', []);

      setAccount(accounts[0]);
      setSigner(provider.getSigner());
    }

    getAccounts();
  }, [account]);

  useEffect(() => {
    const effect = async () => {
      const count = await factoryContract.count()
      setContractCount(count.toNumber())
    }
    effect()
  }, [factoryContract])

  const getEscrows = useHandler(async () => {
      const escrows = []
      try {
        for (let i = 0; i < contractCount; ++i) {
          const address = await factoryContract.addresses(i)
          const escrowContract = getEscrow(signer, address)
          const arbiter = await escrowContract.arbiter()
          const beneficiary = await escrowContract.beneficiary()
          const depositor = await escrowContract.depositor()
          const isApproved = await escrowContract.isApproved()
          const value = (await provider.getBalance(address))
          
          const escrow = {
            address,
            arbiter,
            beneficiary,
            depositor,
            isApproved,
            value: ethers.utils.formatUnits(value, 'ether'),
            handleApprove: async () => {
              escrowContract.on('Approved', () => {
                setEscrows(escrows => {
                  return escrows.map(escrow => {
                    if (escrow.address === address) {
                      return {...escrow, isApproved: true }
                    }
                    return escrow
                  })
                })
              });

              const approveTxn = await escrowContract.connect(signer).approve();
              await approveTxn.wait();
            },
          };
          escrows.push(escrow)
        }
      } catch (error) {
        console.error(error)
      }
      return escrows
  })

  useEffect(() => {
    if (factoryContract != null && signer != null) {
      getEscrows().then(escrows => setEscrows(escrows))
    }
  }, [contractCount, factoryContract, getEscrows, signer])

  async function newContract() {
    const beneficiary = document.getElementById('beneficiary').value;
    const arbiter = document.getElementById('arbiter').value;
    const amount = document.getElementById('amount').value;
    const value = ethers.utils.parseEther(amount)
    const makeEscrowTx = await factoryContract.makeEscrow(arbiter, beneficiary, { value })
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
      const factory = await deployFactory(signer);
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
        <button onClick={handleClickClearFactory}>Clear Factory Contract</button>
      </div>
      <section>
        <form onSubmit={handleSubmit}>
          <h1> New Contract </h1>
          <label>
            Arbiter Address
            <input type="text" id="arbiter" value="0x70997970C51812dc3A010C7d01b50e0d17dc79C8" />
          </label>

          <label>
            Beneficiary Address
            <input type="text" id="beneficiary" value="0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" />
          </label>

          <label>
            Deposit Amount
            <input type="text" id="amount" />
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
            return <Escrow key={escrow.address} {...escrow} />;
          })}
        </div>
      </section>
    </div>
  );
}

export default App;
