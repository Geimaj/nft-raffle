import React from "react";

import { useRaffleContract } from "../../../providers/RaffleContractProvider";

import * as S from "./Styles";

function WalletStatus() {
  const { signer } = useRaffleContract();

  console.log("signers", signer);

  return (
    <div className="walletStatus">
      <CreateRaffleButton />

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
  const { connectWallet } = useRaffleContract();
  return <S.Button onClick={connectWallet}>Connect Wallet -{">"}</S.Button>;
}

function CreateRaffleButton() {
  const { createRaffle } = useRaffleContract();
  return <S.Button onClick={createRaffle}>Create Raffle</S.Button>;
}

function DisconnectWalletButton() {
  const { disconnectWallet } = useRaffleContract();
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
