import { requestSignerAccounts } from "../ethereum";
import React, { createContext, useContext, useState } from "react";
import RaffleStore from "/artifacts/contracts/RaffleStore.sol/RaffleStore.json";
import Nft from "/artifacts/contracts/Nft.sol/Nft.json";

import { ethers } from "ethers";

const RaffleContractContext = createContext();

export function RaffleContractProvider({ children }) {
  // 1. expose a connectWallet function
  // 2. connect to / attach to Raffle contract (at some deployed address)
  // 3. expose contract functions
  const CONTRACT_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";
  const NFT_CONTRACT_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";

  const [signer, setSigner] = useState();
  const [contract, setContract] = useState();
  const [nftContract, setNftContract] = useState();

  console.log("contract", contract);

  async function connectWallet() {
    // Connect a metamask wallet
    setSigner(await requestSignerAccounts());
    setContract(new ethers.Contract(CONTRACT_ADDRESS, RaffleStore.abi, signer));
  }

  async function disconnectWallet() {
    // ethers.
    setSigner();
  }

  // Approves transfer from nft owner so that we can alter the nft
  async function approveNftTransfer(nftId) {
    const nftContract = new ethers.Contract(
      NFT_CONTRACT_ADDRESS,
      Nft.abi,
      signer
    );

    setNftContract(nftContract);

    try {
      const res = await nftContract
        .connect(signer)
        .approve(contract.address, ethers.BigNumber.from(nftId));
      console.log("signenerneern", nftContract.connect(signer));
      return res;
    } catch (error) {
      console.log("failed to transfer nft");
      return false;
    }
  }

  async function createRaffle(nftId, numTickets, totalPrice) {
    console.log(
      `creating raffle... with nFTcontract ${nftContract.address}, NFTId: ${nftId}, num tickets: ${numTickets}, totalPrice: ${totalPrice}`
    );
    const res = await contract
      .connect(signer)
      .createRaffle(
        nftContract.address,
        ethers.BigNumber.from(nftId),
        ethers.BigNumber.from(numTickets),
        ethers.BigNumber.from(totalPrice)
      );
    console.log("createRaffle res:", res);
  }

  return (
    <RaffleContractContext.Provider
      value={{
        signer,
        connectWallet,
        disconnectWallet,
        createRaffle,
        approveNftTransfer,
        // enterRaffle,
        // cancelRaffle,
      }}
    >
      {children}
    </RaffleContractContext.Provider>
  );
}

export function useRaffleContract() {
  const context = useContext(RaffleContractContext);

  if (context === undefined) {
    throw new Error(
      "useRaffleContract must be used within a RaffleContractProvider"
    );
  }

  return context;
}
