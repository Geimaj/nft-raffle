import React, { useEffect } from "react";
import { Button } from "../blocks/Navbar/Styles";
import * as S from "./Styles";
import { useState } from "react";
import { useContracts } from "../../providers/ContractsProvider";

import { ethers } from "ethers";

import Nft from "/artifacts/contracts/Nft.sol/Nft.json";

// NFT_CONTRACT_ADDRESS = "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318";

export default function CreateRaffleForm() {
  const {
    signer,
    createRaffle,
    raffleContract,
    approveNftTransfer,
    RAFFLE_CONTRACT_ADDRESS,
  } = useContracts();

  const [ticketPrice, setTicketPrice] = useState(0);
  const [numTickets, setNumTickets] = useState(0);

  const [nftId, setNftId] = useState(5);
  const [nftContractAddress, setNftContractAddress] = useState(
    "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318"
  );

  const nftContract = useNftContract(nftContractAddress);

  const [nftIsUnlocked, setNftIsUnlocked] = useState(false);

  // `unlockStatus` can be one of
  // - "loading" -- loading the approval status of the NFT (will change to one of the statuses below soon)
  // - "disallowed" -- the connected signer does not own the NFT (TODO: could later allow `approvers` to raffle)
  // - "locked" -- our raffle contract has not been granted approval for this NFT
  // - "unlocked" -- raffle contract has been granted approval
  // - "unlocking" -- the transaction granting our contract approval for this NFT is
  // ... pending(will change to one of the above statuses soon)
  const [unlockStatus, setUnlockStatus] = useState("loading");

  // On mount, check if the NFT is approved / unlocked
  useEffect(() => {
    // TODO: Listen for on-chain notifications of the Approval event relating to this NFT
    // and re-run this function when any occur
    async function checkApproval() {
      if (nftContract == null) return;

      setUnlockStatus("loading");
      const approved = await nftContract?.getApproved(nftId);
      const owner = await nftContract?.ownerOf(nftId);
      const signerAddress = await signer.getAddress();

      console.log("owner is ", owner);
      console.log("signerAddress is ", signerAddress);

      if (owner !== signerAddress) {
        setUnlockStatus("disallowed");
        return;
      }

      if (approved === RAFFLE_CONTRACT_ADDRESS) {
        setUnlockStatus("unlocked");
      } else {
        setUnlockStatus("locked");
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
    // let approved = await approveNftTransfer(nftContractAddress, nftId);

    // get the approval transaction result
    const result = await nftContract.approve(
      raffleContract.address,
      ethers.BigNumber.from(nftId)
    );

    // Then display a loading indicator while the transaction is confirmed on the blockchain
    setUnlockStatus("unlocking");

    console.log("handleUnlockNft: approve transaction result: ", result);

    // Then wait for the transaction to complete...
    await result.wait();
    // ...at which point check if the approved address is the raffle contract address
    const approved = await nftContract?.getApproved(nftId);
    if (approved === RAFFLE_CONTRACT_ADDRESS) {
      console.log("unlock successful!");
      setUnlockStatus("unlocked");
    } else {
      // TODO: Handle if the unlock wasn't successful (eg user rejected transaction, no gas, etc)
      alert(`NFT unlock failed!. Result: ${result}; approved: ${approved}`);
    }
  }

  return (
    <S.Wrapper>
      <RaffleForm
        ticketPrice={ticketPrice}
        setTicketPrice={setTicketPrice}
        numTickets={numTickets}
        setNumTickets={setNumTickets}
        unlockStatus={unlockStatus}
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
  unlockStatus,
  nftId,
  setNftId,
  handleUnlockNft,
  handleSubmit,
  nftContractAddress,
  setNftContractAddress,
}) {
  return (
    <>
      <div style={{ opacity: unlockStatus !== "unlocked" ? "1" : "0.3" }}>
        <h2>
          Step 1: First, let's unlock the NFT you want to use for this raffle
        </h2>
        <UnlockNftForm
          handleUnlockNft={handleUnlockNft}
          nftContractAddress={nftContractAddress}
          setNftContractAddress={setNftContractAddress}
          nftId={nftId}
          setNftId={setNftId}
        />
        {unlockStatus === "loading" && <h3>? Nft lock status loading...</h3>}
        {unlockStatus === "locked" && <h3>🔒 Nft locked</h3>}
        {unlockStatus === "unlocked" && <h3>✅ Nft Unlocked</h3>}
        {unlockStatus === "unlocking" && (
          <h3 style={{ transition: "all 200ms", transform: "rotate(30deg)" }}>
            Unlocking NFT
          </h3>
        )}
        {unlockStatus === "disallowed" && <h3>❌ You do not own this NFT</h3>}
      </div>

      <hr />

      <div style={{ opacity: unlockStatus === "unlocked" ? "1" : "0.3" }}>
        <h2>Step 2: Next, choose your raffle's number and price of tickets</h2>
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
        </form>
      </div>
    </>
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

function useNftContract(nftContractAddress) {
  const { signer, chainId } = useContracts();

  const [nftContract, setNftContract] = useState();

  useEffect(() => {
    if (!signer) {
      console.error("oh shit, can't setup a contract with a null signer");

      return nftContract;
    }

    const contract = new ethers.Contract(nftContractAddress, Nft.abi, signer);
    setNftContract(contract);
  }, [signer, chainId]);

  return nftContract;
}
