const { expect } = require("chai");
require('dotenv').config();
let { networkConfig } = require('../helper-hardhat-config')


describe("RaffleStore", function () {
  let raffleStore;
  let testNft;
  let deployer;
  let raffleOwner;
  let rafflePlayer;
  const nftId = 1;
  const raffleTicketPrice = 1;
  const totalRaffleTickets = 10;

  beforeEach(async () => {
    await deployments.fixture(['mocks', 'vrf', 'raffleStore', 'nft']);
    [deployer, raffleOwner, rafflePlayer] = await ethers.getSigners()

    const RaffleStore = await deployments.get('RaffleStore')
    raffleStore = await ethers.getContractAt('RaffleStore', RaffleStore.address)

    const TestNft = await deployments.get('Nft')
    testNft = await ethers.getContractAt('Nft', TestNft.address)

    await testNft.connect(raffleOwner).mint(raffleOwner.address, "1")
  })

  it("Should store the owner", async function () {
    expect(await raffleStore.owner()).to.equal(deployer.address)
  });

  it("Should not create a raffle without approval to spend the NFT", async function () {
    await expect(
      raffleStore.createRaffle(testNft.address, nftId, totalRaffleTickets, raffleTicketPrice)
    ).to.be.reverted
  })

  it("Should approve the store to transfer NFT", async function () {
    await expect(
      testNft.connect(raffleOwner).approve(raffleStore.address, nftId)
    ).to.emit(testNft, 'Approval')
      .withArgs(raffleOwner.address, raffleStore.address, nftId)

    let approvedAddress = await testNft.getApproved(1);

    await expect(
      approvedAddress
    ).to.equal(raffleStore.address)
  })


  it("Should create a new raffle", async function () {
    await testNft.connect(raffleOwner).approve(raffleStore.address, 1)

    let createRaffleRequest = raffleStore.connect(raffleOwner).createRaffle(testNft.address, nftId, totalRaffleTickets, raffleTicketPrice)

    await expect(
      createRaffleRequest
    ).to.emit(testNft, "Transfer").withArgs(raffleOwner.address, raffleStore.address, nftId);

    await expect(
      createRaffleRequest
    ).to.emit(raffleStore, "RaffleCreated").withArgs(0, raffleOwner.address);
  })

  it("Should not sell extra tickets", async function() {
    await testNft.connect(raffleOwner).approve(raffleStore.address, nftId)
    await raffleStore.connect(raffleOwner).createRaffle(testNft.address, nftId, totalRaffleTickets, raffleTicketPrice);
    
    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, totalRaffleTickets + 1)
    ).to.be.revertedWith('Not enough tickets available')

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, totalRaffleTickets + -1)
    ).to.be.satisfy

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 2)
    ).to.be.revertedWith('Not enough tickets available')
      
    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 0)
    ).to.be.revertedWith("Not enough tickets purchased")

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, Number.MAX_VALUE)
    ).to.be.reverted

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, -1)
    ).to.be.reverted

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 1)
    ).to.be.satisfy
    
    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 1)
    ).to.be.revertedWith('Not enough tickets available')
  })

  // TODO: test entering a closed / pending_completion raffle

  // TODO: test ticket purchase transfers eth



});
