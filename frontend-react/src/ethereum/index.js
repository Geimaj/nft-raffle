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
