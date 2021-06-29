import React from "react";
import { Button } from "../blocks/Navbar/Styles";
import * as S from "./Styles";
import { useState } from "react";
import { useRaffleContract } from "../../providers/RaffleContractProvider";

export default function CreateRaffleForm() {
  const { createRaffle, approveNftTransfer } = useRaffleContract();

  const [ticketPrice, setTicketPrice] = useState(0);
  const [numTickets, setNumTickets] = useState(0);
  const [nftId, setNftId] = useState();
  const [nftIsUnlocked, setNftIsUnlocked] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    createRaffle(nftId, numTickets, ticketPrice * numTickets);
  };

  const handleUnlockNft = (e) => {
    e.preventDefault();
    approveNftTransfer(nftId);
    setNftIsUnlocked(true);
  };

  return (
    <S.Wrapper>
      <h1>Form.</h1>
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
        <Button type="submit">Unlock NFT</Button>
      </form>

      {nftIsUnlocked ? (
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
        </form>
      ) : (
        <h3>Please unlock your Nft to create a raffle</h3>
      )}
    </S.Wrapper>
  );
}
