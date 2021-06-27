import { requestSignerAccounts } from "../ethereum";
import React, { createContext, useContext, useState } from "react";
import { ethers } from "ethers";

const RaffleContractContext = createContext();

export function RaffleContractProvider({ children }) {
  // 1. expose a connectWallet function
  // 2. connect to / attach to Raffle contract (at some deployed address)
  // 3. expose contract functions

  const [signer, setSigner] = useState();

  async function connectWallet() {
    // Connect a metamask wallet
    setSigner(await requestSignerAccounts());
  }

  async function disconnectWallet() {
    // ethers.
    setSigner();
  }

  return (
    <RaffleContractContext.Provider
      value={{
        signer,
        connectWallet,
        disconnectWallet,
        // createRaffle,
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
