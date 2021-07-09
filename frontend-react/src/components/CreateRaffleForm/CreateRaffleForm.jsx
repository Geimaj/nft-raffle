import React from "react";
import { Button } from "../blocks/Navbar/Styles";
import * as S from "./Styles";
import { useState } from "react";
import { useContracts } from "../../providers/ContractsProvider";

// NFT_CONTRACT_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";

export default function CreateRaffleForm() {
  const { signer, createRaffle, approveNftTransfer } = useContracts();

  const [ticketPrice, setTicketPrice] = useState(0);
  const [numTickets, setNumTickets] = useState(0);
  const [nftId, setNftId] = useState("");
  const [nftContractAddress, setNftContractAddress] = useState("");

  const [nftIsUnlocked, setNftIsUnlocked] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    createRaffle(
      nftContractAddress,
      nftId,
      numTickets,
      ticketPrice * numTickets
    );
  };

  async function handleUnlockNft(e) {
    e.preventDefault();
    let approved = await approveNftTransfer(nftContractAddress, nftId);

    if (approved) setNftIsUnlocked(true);
    else {
      if (signer) {
        alert(
          `It seems like you don't own the nft with id ${nftId}. Are you mistaken? Or just a fucking liar.`
        );
      } else {
        alert(
          `It seems like you haven't connected your wallet (or reset the state, because we haven't implemented persistent state management), are you really that fucking incompetent?`
        );
      }
    }
  }

  return (
    <S.Wrapper>
      <h2>First, let’s unlock the NFT you want to use for this raffle</h2>
      <RaffleForm
        ticketPrice={ticketPrice}
        setTicketPrice={setTicketPrice}
        numTickets={numTickets}
        setNumTickets={setNumTickets}
        nftIsUnlocked={nftIsUnlocked}
        nftId={nftId}
        setNftId={setNftId}
        handleUnlockNft={handleUnlockNft}
        nftContractAddress={nftContractAddress}
        setNftContractAddress={setNftContractAddress}
        handleSubmit={handleSubmit}
      />
    </S.Wrapper>
  );
}

function RaffleForm({
  ticketPrice,
  setTicketPrice,
  numTickets,
  setNumTickets,
  nftIsUnlocked,
  nftId,
  setNftId,
  handleUnlockNft,
  handleSubmit,
  nftContractAddress,
  setNftContractAddress,
}) {
  return nftIsUnlocked ? (
    <form onSubmit={handleSubmit}>
      <label>
        Ticket Price:
        <input
          type="number"
          value={ticketPrice}
          onChange={(e) => {
            setTicketPrice(e.target.value);
          }}
        />
      </label>

      <label>
        Ticket Quantity:
        <input
          type="number"
          value={numTickets}
          onChange={(e) => {
            setNumTickets(e.target.value);
          }}
        />
      </label>

      <label>
        NFT id:
        <input
          type="number"
          value={nftId}
          onChange={(e) => {
            setNftId(e.target.value);
          }}
        />
      </label>
      <Button type="submit" value="Create Raffle">
        Create Raffle
      </Button>
      <h3>Total raffle value: {numTickets * ticketPrice}</h3>
      <h3>✅ Nft Unlocked</h3>
    </form>
  ) : (
    <div>
      <UnlockNftForm
        ticketPrice={ticketPrice}
        setTicketPrice={setTicketPrice}
        numTickets={numTickets}
        setNumTickets={setNumTickets}
        nftIsUnlocked={nftIsUnlocked}
        nftId={nftId}
        setNftId={setNftId}
        handleUnlockNft={handleUnlockNft}
        nftContractAddress={nftContractAddress}
        setNftContractAddress={setNftContractAddress}
      />
      <h3>🔒 Nft locked</h3>
    </div>
  );
}

function UnlockNftForm({
  handleUnlockNft,
  nftContractAddress,
  setNftContractAddress,
  nftId,
  setNftId,
}) {
  const { connectWallet, signer } = useContracts();

  return (
    <form onSubmit={handleUnlockNft}>
      <div>
        <label>
          NFT Contract address
          <input
            type="text"
            value={nftContractAddress}
            onChange={(e) => setNftContractAddress(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label>
          NFT id:
          <input
            type="number"
            value={nftId}
            onChange={(e) => {
              setNftId(e.target.value);
            }}
          />
        </label>
      </div>

      {signer ? (
        <Button type="submit" disabled={nftId == null}>
          Unlock NFT
        </Button>
      ) : (
        <Button onClick={() => connectWallet()}>
          Connect your wallet to unlock this NFT
        </Button>
      )}
    </form>
  );
}
