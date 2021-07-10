import { ethers } from "ethers";

export async function requestAccount() {
  // await window.ethereum.enable()
  await window.ethereum.request({ method: "eth_requestAccounts" });

  // A Web3Provider wraps a standard Web3 provider, which is
  // what Metamask injects as window.ethereum into each page
  const provider = new ethers.providers.Web3Provider(window.ethereum);

  // The Metamask plugin also allows signing transactions to
  // send ether and pay to change state within the blockchain.
  // For this, you need the account signer...
  const signer = provider.getSigner();

  return signer;
}

// Note that what this returns may not be a properly connected signer
// See how we test to make sure it is in `src/providers/ContractsProvider`
export function getConnectedAccount() {
  const signer = new ethers.providers.Web3Provider(window.ethereum).getSigner();

  console.log("getConnectedAccount: signer", signer);

  return signer;
}
