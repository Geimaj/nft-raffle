import React, { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";

import RaffleStore from "/artifacts/contracts/RaffleStore.sol/RaffleStore.json";
import Nft from "/artifacts/contracts/Nft.sol/Nft.json";

import { getConnectedAccount, requestAccount } from "../ethereum";

const RAFFLE_CONTRACT_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
const NFT_CONTRACT_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";

const ContractsContext = createContext();

export function ContractsProvider({ children }) {
  const { connectedSigner, connectSigner } = useConnectedSigner();

  const raffleContract = useRaffleContract(connectedSigner);

  const chainId = useChainId();

  // Approves transfer from nft owner so that we can alter the nft
  async function approveNftTransfer(nftContractAddress, nftId) {
    if (connectedSigner == null) {
      throw new Error(
        "Please connect your wallet before tryring to approve an NFT transfer."
      );
    }

    const nftContract = new ethers.Contract(
      nftContractAddress,
      Nft.abi,
      connectedSigner
    );

    try {
      const res = await nftContract.approve(
        raffleContract.address,
        ethers.BigNumber.from(nftId)
      );
      return res;
    } catch (error) {
      console.log("failed to approve transfer nft");
      console.error("error", error);
      return false;
    }
  }

  async function createRaffle(
    nftContractAddress,
    nftId,
    numTickets,
    totalPrice
  ) {
    console.log(
      `creating raffle... with nFTcontract ${nftContractAddress}, NFTId: ${nftId}, num tickets: ${numTickets}, totalPrice: ${totalPrice}`
    );
    const res = await raffleContract.createRaffle(
      nftContractAddress,
        ethers.BigNumber.from(nftId),
        ethers.BigNumber.from(numTickets),
        ethers.BigNumber.from(totalPrice)
      );
    console.log("createRaffle res:", res);
  }

  //   return (
  //     <RaffleContractContext.Provider
  //       value={{
  //         signer,
  //         connectWallet,
  //         disconnectWallet,
  //         createRaffle,
  //         approveNftTransfer,
  //         // enterRaffle,
  //         // cancelRaffle,
  //       }}

  return (
    <ContractsContext.Provider
      value={{
        connectWallet: connectSigner,
        signer: connectedSigner,
        chainId,
        raffleContract, // probably want to expose a wrapped version of this
        createRaffle,
        approveNftTransfer,
      }}
    >
      {children}
    </ContractsContext.Provider>
  );
}

function useRaffleContract(signer) {
  const [raffleContract, setRaffleContract] = useState();

  // Connect to the contract with the up-to-date connected signer
  useEffect(() => {
    if (signer == null) return;

    setRaffleContract(
      new ethers.Contract(RAFFLE_CONTRACT_ADDRESS, RaffleStore.abi, signer)
    );
  }, [signer]);

  return raffleContract;
}

function useConnectedSigner() {
  const [connectedSigner, setConnectedSigner] = useState();

  // TODO: On mount, check if the user has already connected their wallet
  useEffect(() => {
    // if (window.etherem...) ...

    // TODO: Setup listener for `accountsChanged` and setConnectedSigner when it occurs
    // ethereum.on("accountsChanged", (accounts) => {
    // Handle the new accounts, or lack thereof.
    // "accounts" will always be an array, but it can be empty.
    setConnectedSigner(getConnectedAccount());
    // });
  }, []);

  async function connectSigner() {
    const signer = await requestAccount();
    setConnectedSigner(signer);
  }

  return { connectedSigner, connectSigner };
}

function useChainId() {
  const [chainId, setChainId] = useState();

  useEffect(() => {
    function onChainChanged(newChainId) {
      setChainId(newChainId);
    }

    window.ethereum
      .request({
        method: "eth_chainId",
      })
      .then(onChainChanged);

    window.ethereum.on("chainChanged", onChainChanged);

    return () => {
      // cleanup function: remove listener
      window.ethereum?.off("chainChanged", onChainChanged);
    };
  }, []);

  return chainId;
}

export function useContracts() {
  const context = useContext(ContractsContext);

  if (context === undefined) {
    throw new Error(
      "To use useContract you must wrap this component or its ancestor in a <ContractsProvider>"
    );
  }

  return context;
}

// ---------------------
// ---------------------
// ---------------------
// ---------------------
// ---------------------
// ---------------------

// export function RaffleContractProvider({ children }) {
//   // 1. expose a connectWallet function
//   // 2. connect to / attach to Raffle contract (at some deployed address)
//   // 3. expose contract functions
//   const CONTRACT_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
//   const NFT_CONTRACT_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";

//   const [signer, setSigner] = useState();
//   const [contract, setContract] = useState();
//   const [nftContract, setNftContract] = useState();

//   console.log("contract", contract);

//   async function connectWallet() {
//     // Connect a metamask wallet
//     setSigner(await requestSignerAccounts());
//     setContract(new ethers.Contract(CONTRACT_ADDRESS, RaffleStore.abi, signer));
//   }

//   async function disconnectWallet() {
//     // ethers.
//     setSigner();
//   }

//   // Approves transfer from nft owner so that we can alter the nft
//   async function approveNftTransfer(nftId) {
//     const nftContract = new ethers.Contract(
//       NFT_CONTRACT_ADDRESS,
//       Nft.abi,
//       signer
//     );

//     setNftContract(nftContract);

//     try {
//       const res = await nftContract
//         .connect(signer)
//         .approve(contract.address, ethers.BigNumber.from(nftId));
//       console.log("signenerneern", nftContract.connect(signer));
//       return res;
//     } catch (error) {
//       console.log("failed to transfer nft");
//       return false;
//     }
//   }

//   async function createRaffle(nftId, numTickets, totalPrice) {
//     console.log(
//       `creating raffle... with nFTcontract ${nftContract.address}, NFTId: ${nftId}, num tickets: ${numTickets}, totalPrice: ${totalPrice}`
//     );
//     const res = await contract
//       .connect(signer)
//       .createRaffle(
//         nftContract.address,
//         ethers.BigNumber.from(nftId),
//         ethers.BigNumber.from(numTickets),
//         ethers.BigNumber.from(totalPrice)
//       );
//     console.log("createRaffle res:", res);
//   }

//   return (
//     <RaffleContractContext.Provider
//       value={{
//         signer,
//         connectWallet,
//         disconnectWallet,
//         createRaffle,
//         approveNftTransfer,
//         // enterRaffle,
//         // cancelRaffle,
//       }}
//     >
//       {children}
//     </RaffleContractContext.Provider>
//   );
// }
