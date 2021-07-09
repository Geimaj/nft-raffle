import React from "react";

import { useContracts } from "../../../providers/ContractsProvider";

import * as S from "./Styles";

function WalletStatus() {
  const { signer } = useContracts();

  console.log("signers", signer);

  return (
    <div className="walletStatus">
      {signer ? (
        <code>
          Connected to {signer.provider.provider.selectedAddress}{" "}
          <DisconnectWalletButton />
        </code>
      ) : (
        <ConnectWalletButton />
      )}
    </div>
  );
}

function ConnectWalletButton() {
  const { connectWallet } = useContracts();
  return <S.Button onClick={connectWallet}>Connect Wallet -{">"}</S.Button>;
}

function DisconnectWalletButton() {
  const { disconnectWallet } = useContracts();
  return <button onClick={disconnectWallet}>Disconnect Wallet</button>;
}

export default function Navbar() {
  return (
    <S.Navbar>
      <div className="logo">Crumpet</div>
      <WalletStatus />
    </S.Navbar>
  );
}
