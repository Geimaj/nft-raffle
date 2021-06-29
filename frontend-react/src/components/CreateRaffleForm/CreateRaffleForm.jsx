import React from "react";
import { Button } from "../blocks/Navbar/Styles";
import * as S from "./Styles";
import { useState } from "react";
import { useRaffleContract } from "../../providers/RaffleContractProvider";

export default function CreateRaffleForm() {
  const { createRaffle, approveNftTransfer, signer } = useRaffleContract();

  const [ticketPrice, setTicketPrice] = useState(0);
  const [numTickets, setNumTickets] = useState(0);
  const [nftId, setNftId] = useState();

  const [nftIsUnlocked, setNftIsUnlocked] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    createRaffle(nftId, numTickets, ticketPrice * numTickets);
  };

  async function handleUnlockNft(e) {
    e.preventDefault();
    let approved = await approveNftTransfer(nftId);

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

  function UnlockNftForm() {
    return (
      <form onSubmit={handleUnlockNft}>
        <label>
          NFT id:
          <input
            type="number"
            value={nftId}
            onChange={() => {
              setNftId(event.target.value);
            }}
          />
        </label>
        <Button type="submit" disabled={nftId == null}>
          Unlock NFT
        </Button>
      </form>
    );
  }

  function RaffleForm() {
    return nftIsUnlocked ? (
      <form onSubmit={handleSubmit}>
        <label>
          Ticket Price:
          <input
            type="number"
            value={ticketPrice}
            onChange={() => {
              setTicketPrice(event.target.value);
            }}
          />
        </label>

        <label>
          Ticket Quantity:
          <input
            type="number"
            value={numTickets}
            onChange={() => {
              setNumTickets(event.target.value);
            }}
          />
        </label>

        <label>
          NFT id:
          <input
            type="number"
            value={nftId}
            onChange={() => {
              setNftId(event.target.value);
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
        {" "}
        <UnlockNftForm></UnlockNftForm>
        <h3>🔒 Nft locked</h3>
      </div>
    );
  }

  return (
    <S.Wrapper>
      <h2>First, let’s unlock the NFT you want to use for this raffle</h2>
      <RaffleForm></RaffleForm>
    </S.Wrapper>
  );
}
