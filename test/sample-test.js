const { expect } = require("chai");
require('dotenv').config();


describe("RaffleStore", function() {
  it("Should deploy and set the owner", async function() {
    const {VRF_COORDINATOR_ADDRESS, LINK_TOKEN_ADDRESS, CHAINLINK_FEE, CHAINLINK_KEYHASH} = process.env;
    const RaffleStore = await ethers.getContractFactory("RaffleStore");
    const raffleStore = await RaffleStore.deploy(VRF_COORDINATOR_ADDRESS, LINK_TOKEN_ADDRESS, CHAINLINK_FEE, CHAINLINK_KEYHASH);
    await raffleStore.deployed();

    const [deployer] = await ethers.getSigners();

    expect(await raffleStore.owner()).to.equal(deployer.address)
  });
});
