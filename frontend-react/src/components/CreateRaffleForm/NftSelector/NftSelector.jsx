import React, { useEffect } from "react";
import { useContracts } from "../../../providers/ContractsProvider";
import { useNftSelector } from "./useNftSelector";

const NftSelector = ({ onNftSelected }) => {
  const { fetchNftsForAddress, ownedNfts } = useNftSelector();
  const { signer } = useContracts();

  const scan = async () => {
    fetchNftsForAddress(signer.provider.provider.selectedAddress);
  };

  const handleTokenSelected = (contract, token) => {
    onNftSelected(contract, token);
  };

  function renderNfts(contract) {
    let nfts = ownedNfts[contract];
    return (
      <div>
        Nfts for contract: {contract}
        {nfts.map((nft, i) => (
          <div key={i}>
            {nft.toNumber()}
            <input
              type="radio"
              name="nft-select"
              onChange={() => handleTokenSelected(contract, nft)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <h2>Pick an Nft!</h2>
      <button onClick={scan}>Scan</button>
      <div>
        {ownedNfts &&
          Object.keys(ownedNfts).map((key, i) => (
            <div key={i}>{renderNfts(key)}</div>
          ))}
      </div>
    </div>
  );
};

export default NftSelector;
