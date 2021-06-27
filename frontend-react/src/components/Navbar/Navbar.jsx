import React from "react";

import { useRaffleContract } from "../../providers/RaffleContractProvider";

function WalletStatus() {
  const { signer } = useRaffleContract();

  console.log("signers", signer);

  return signer ? (
    <code>
      Connected to {signer.provider.provider.selectedAddress}{" "}
      <DisconnectWalletButton />
    </code>
  ) : (
    <ConnectWalletButton />
  );
}

function ConnectWalletButton() {
  const { connectWallet } = useRaffleContract();
  return <button onClick={connectWallet}>Connect Wallet</button>;
}

function DisconnectWalletButton() {
  const { disconnectWallet } = useRaffleContract();
  return <button onClick={disconnectWallet}>Disconnect Wallet</button>;
}

export default function Navbar() {
  return (
    <div>
      <p>Crumpet</p>
      <WalletStatus />
    </div>
  );
}
