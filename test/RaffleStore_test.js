const { expect } = require("chai");
require('dotenv').config();
let { networkConfig } = require('../helper-hardhat-config')


describe("RaffleStore", function() {
  let raffleStore;

  beforeEach(async () => {
    await deployments.fixture(['mocks', 'vrf', 'raffleStore'])

    // setup chainlink deps
    const LinkToken = await deployments.get('LinkToken')
    linkToken = await ethers.getContractAt('LinkToken', LinkToken.address)
    const VRFCoordinatorMock = await deployments.get('VRFCoordinatorMock')
    vrfCoordinatorMock = await ethers.getContractAt('VRFCoordinatorMock', VRFCoordinatorMock.address)

    const RaffleStore = await deployments.get('RaffleStore')
    raffleStore = await ethers.getContractAt('RaffleStore', RaffleStore.address)
  })

  it("Should store the owner", async function() {
    const [deployer] = await ethers.getSigners();

    expect(await raffleStore.owner()).to.equal(deployer.address)
  });
});
