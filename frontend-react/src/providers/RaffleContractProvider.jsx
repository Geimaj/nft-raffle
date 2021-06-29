import { requestSignerAccounts } from "../ethereum";
import React, { createContext, useContext, useState } from "react";
import RaffleStore from "/artifacts/contracts/RaffleStore.sol/RaffleStore.json";
import { ethers } from "ethers";

const RaffleContractContext = createContext();

export function RaffleContractProvider({ children }) {
  // 1. expose a connectWallet function
  // 2. connect to / attach to Raffle contract (at some deployed address)
  // 3. expose contract functions
  const CONTRACT_ADDRESS = "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853";

  const [signer, setSigner] = useState();
  const [contract, setContract] = useState();

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

  async function createRaffle(nftContract, nftId, numTickets, totalPrice) {
    console.log("creating raffle...");
    const res = await contract
      .connect(signer)
      .createRaffle(
        (nftContract = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"),
        (nftId = 0),
        (numTickets = 1),
        (totalPrice = 20)
      );
    console("createRaffle res:", res);
  }

  return (
    <RaffleContractContext.Provider
      value={{
        signer,
        connectWallet,
        disconnectWallet,
        createRaffle,
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
