const { expect } = require("chai");
require('dotenv').config();
let { networkConfig } = require('../helper-hardhat-config')


describe("RaffleStore", function() {
  let raffleStore;
  let testNft;
  let deployer; 
  let raffleOwner;
  
  beforeEach(async () => {
    await deployments.fixture(['mocks', 'vrf', 'raffleStore', 'nft']);
    [deployer, raffleOwner] = await ethers.getSigners()

    const RaffleStore = await deployments.get('RaffleStore')
    raffleStore = await ethers.getContractAt('RaffleStore', RaffleStore.address)

    const TestNft = await deployments.get('Nft')
    testNft = await ethers.getContractAt('Nft', TestNft.address)

    await testNft.connect(raffleOwner).mint(raffleOwner.address, "1")

    
  })

  it("Should store the owner", async function() {
    expect(await raffleStore.owner()).to.equal(deployer.address)
  });

  it("Should not create a raffle without approval to spend the NFT", async function (){
    await expect(
      raffleStore.createRaffle(testNft.address, 1, 10, 1)
    ).to.be.reverted
  })

  it("Should approve the store to transfer NFT", async function (){
    await expect(
      testNft.connect(raffleOwner).approve(raffleStore.address, 1)
    ).to.emit(testNft, 'Approval')
    .withArgs(raffleOwner.address, raffleStore.address, 1)

    let approvedAddress = await testNft.getApproved(1);

    await expect(
      approvedAddress
    ).to.equal(raffleStore.address)
  })
});
