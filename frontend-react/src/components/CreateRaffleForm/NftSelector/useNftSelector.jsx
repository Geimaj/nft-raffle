import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { useContracts } from "../../../providers/ContractsProvider";
import Nft from "/artifacts/contracts/Nft.sol/Nft.json";

export async function isEnumerable(contract) {
  const IERC721EnumerableSelector = "0x780e9d63";
  return contract.supportsInterface(IERC721EnumerableSelector);
}

const contractsList = [
  "0x8A791620dd6260079BF849Dc5567aDC3F2FdC318",
  // '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
];

export const useNftSelector = () => {
  const { signer } = useContracts();
  const [ownedNfts, setOwnedNfts] = useState({});

  async function _fetchNftsForAddress(nftAddress, address) {
    let nft = new ethers.Contract(nftAddress, Nft.abi, signer);
    let isContractEnumerable = await isEnumerable(nft);
    if (!isContractEnumerable) {
      return;
    }

    let numTokensOwned = (await nft.balanceOf(address)).toNumber();

    let requests = new Array(numTokensOwned)
      .fill(null)
      .map(async (value, i) => {
        return await nft.tokenOfOwnerByIndex(address, i);
      });

    let nfts = await Promise.all(requests);
    const newNfts = { ...ownedNfts, [nftAddress]: nfts };
    setOwnedNfts(newNfts);
  }

  async function fetchAllNftsForAddress(address) {
    for (let contract of contractsList) {
      _fetchNftsForAddress(contract, address);
    }
  }

  return {
    fetchNftsForAddress: fetchAllNftsForAddress,
    ownedNfts,
  };
};
