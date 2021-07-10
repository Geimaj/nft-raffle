import React, { useEffect } from "react";
import { useContracts } from "../../providers/ContractsProvider";

const RaffleList = () => {
  const { raffleContract } = useContracts();

  const fetchRaffles = async () => {
    console.log(raffleContract);
    console.log(await raffleContract.raffles.length);
  };

  return (
    <div>
      These are the active raffles:
      <button onClick={fetchRaffles}>Refresh</button>
    </div>
  );
};

export default RaffleList;
