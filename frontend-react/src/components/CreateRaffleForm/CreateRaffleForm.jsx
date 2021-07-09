import React, { useEffect } from "react";
import { Button } from "../blocks/Navbar/Styles";
import * as S from "./Styles";
import { useState } from "react";
import { useContracts } from "../../providers/ContractsProvider";

import { ethers } from "ethers";

import Nft from "/artifacts/contracts/Nft.sol/Nft.json";

// NFT_CONTRACT_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";

function useNftContract(nftContractAddress) {
  const { signer } = useContracts();

  const [nftContract, setNftContract] = useState();

  useEffect(() => {
    if (!signer) {
      console.error("oh shit, can't setup a contract with a null signer");

      return nftContract;
    }

    const contract = new ethers.Contract(nftContractAddress, Nft.abi, signer);
    setNftContract(contract);
  }, [signer]);

  return nftContract;
}

export default function CreateRaffleForm() {
  const { signer, createRaffle, approveNftTransfer, RAFFLE_CONTRACT_ADDRESS } =
    useContracts();

  const [ticketPrice, setTicketPrice] = useState(0);
  const [numTickets, setNumTickets] = useState(0);

  const [nftId, setNftId] = useState(1);
  const [nftContractAddress, setNftContractAddress] = useState(
    "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"
  );

  const nftContract = useNftContract(nftContractAddress);

  const [nftIsUnlocked, setNftIsUnlocked] = useState(false);

  // On mount, check if the NFT is approved / unlocked
  useEffect(() => {
    // TODO: Listen for on-chain notifications of the Approval event relating to this NFT
    // and re-run this function when any occur
    async function checkApproval() {
      if (nftContract == null) return;

      const approved = await nftContract?.getApproved(nftId);

      if (approved === RAFFLE_CONTRACT_ADDRESS) {
        setNftIsUnlocked(true);
        console.log("NFT IS UNLOCKED BBY (approved is: ", approved);
      } else {
        setNftIsUnlocked(false);
      }

      console.log("NFT IS approved to: ", approved);
    }

    checkApproval();
  }, [nftContract, nftId]);

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

    // TODO: Stop exporting approveNftTransfer from ContractsProvider and
    // instead make a function for this next to useNftContract()
    let approved = await approveNftTransfer(nftContractAddress, nftId);

    // TODO: get the transaction result
    //const result = await nftContract.approve(raffleContract.address,ethers.BigNumber.from(nftId))
    // Then display a loading indicator while the transaction is confirmed on the blockchain
    //setUnlockLoading(true)
    // Then wait for the transaction to complete...
    //await transaction.wait()
    // ...at which point check if the approved address is the raffle contract address
    // and if so setNftIsUnlocked(true)

    if (approved) {
      // This is fakeness
      // setNftIsUnlocked(true);
    } else {
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
