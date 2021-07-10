const { expect } = require("chai");
require('dotenv').config();
let { networkConfig } = require('../helper-hardhat-config');
const { createRaffle } = require("./helpers");

describe("RaffleStore", function () {
  let raffleStore;
  let testNft;
  let deployer;
  let raffleOwner;
  let rafflePlayers;
  let rafflePlayer;
  let vrfCoordinatorMock;
  const nftId = 1;
  const totalRafflePrice = ethers.utils.parseUnits('1', "ether");
  const totalRaffleTickets = ethers.BigNumber.from('10');
  const ticketPrice =  ethers.BigNumber.from(totalRafflePrice).div(totalRaffleTickets);
 
  beforeEach(async () => {
    await deployments.fixture(['mocks', 'vrf', 'raffleStore', 'nft']);
    [deployer, raffleOwner, ...rafflePlayers] = await ethers.getSigners()
    rafflePlayer = rafflePlayers[0];

    const RaffleStore = await deployments.get('RaffleStore')
    raffleStore = await ethers.getContractAt('RaffleStore', RaffleStore.address)

    const TestNft = await deployments.get('Nft')
    testNft = await ethers.getContractAt('Nft', TestNft.address)

    const VRFCoordinatorMock = await deployments.get('VRFCoordinatorMock')
    vrfCoordinatorMock = await ethers.getContractAt('VRFCoordinatorMock', VRFCoordinatorMock.address)

    await testNft.connect(raffleOwner).mint(raffleOwner.address, "1")
  })

  it("Should store the owner", async function () {
    expect(await raffleStore.owner()).to.equal(deployer.address)
  });

  it("Should not create a raffle without approval to spend the NFT", async function () {
    await expect(
      raffleStore.createRaffle(testNft.address, nftId, totalRaffleTickets, totalRafflePrice)
    ).to.be.reverted
  })

  it("Should approve the store to transfer NFT", async function () {
    await expect(
      testNft.connect(raffleOwner).approve(raffleStore.address, nftId)
    ).to.emit(testNft, 'Approval')
      .withArgs(raffleOwner.address, raffleStore.address, nftId)

    let approvedAddress = await testNft.getApproved(nftId);

    await expect(
      approvedAddress
    ).to.equal(raffleStore.address)
  })

  it("Should create a new raffle", async function () {
    await testNft.connect(raffleOwner).approve(raffleStore.address, nftId)

    let createRaffleRequest = raffleStore.connect(raffleOwner).createRaffle(testNft.address, nftId, totalRaffleTickets, totalRafflePrice)

    await expect(
      createRaffleRequest
    ).to.emit(testNft, "Transfer").withArgs(raffleOwner.address, raffleStore.address, nftId);

    await expect(
      createRaffleRequest
    ).to.emit(raffleStore, "RaffleCreated").withArgs(0, raffleOwner.address);
  })

  it("Should not sell extra tickets", async function() {
   await createRaffle();

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, totalRaffleTickets.add(1))
    ).to.be.revertedWith('Not enough tickets available')

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 
        totalRaffleTickets.sub('1'), {
        value: ticketPrice.mul(totalRaffleTickets.add('-1'))
      })
    ).to.not.be.reverted

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, ethers.BigNumber.from(2))
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
      raffleStore.connect(rafflePlayer).enterRaffle(0, 1, {
        value: ticketPrice.toString()
      })
    ).to.not.be.reverted
    
    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 1)
    ).to.be.revertedWith('Raffle no longer active')
  })

  it("Should check the eth deposit matches the ticket price", async () => {
    await createRaffle();
    
    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 1)
    ).to.be.revertedWith("Ticket price not paid")

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 1, {
        value: ticketPrice.div(2)
      })
    ).to.be.revertedWith("Ticket price not paid")
    
    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 1, {
        value: ticketPrice
      })
    ).to.emit(raffleStore, "TicketsPurchased").withArgs(0, rafflePlayer.address, 1);

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 2, {
        value: ticketPrice.mul(2)
      })
    ).to.emit(raffleStore, "TicketsPurchased").withArgs(0, rafflePlayer.address, 2);

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 2, {
        value: ticketPrice
      })
    ).to.be.revertedWith("Ticket price not paid")

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 1, {
        value: ticketPrice.add(1)
      })
    ).to.be.revertedWith("Ticket price not paid")
  })

  it("Should choose a winner when the last ticket is purchased", async () => {
    await createRaffle();

    await raffleStore.connect(rafflePlayer).enterRaffle(0, totalRaffleTickets, {
      value: ticketPrice.mul(totalRaffleTickets)
    })

    await expect(
      (await raffleStore.raffles(0)).status
    ).to.equal(1)

  })

  it("Should not sell tickets while the raffle is pending completion", async () => {
    await createRaffle();

    await raffleStore.connect(rafflePlayer).enterRaffle(0, totalRaffleTickets, {
      value: ticketPrice.mul(totalRaffleTickets)
    })

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, totalRaffleTickets, {
        value: totalRafflePrice
      })
    ).to.be.revertedWith("Raffle no longer active")

  })

  it("Should award NFT to the winner", async () => {
    await createRaffle();

    let transaction = await raffleStore.connect(rafflePlayer)
      .enterRaffle(0, totalRaffleTickets, {
        value: ticketPrice.mul(totalRaffleTickets)
      })

    const tx_receipt = await transaction.wait()
    const requestId = tx_receipt.events[2].topics[0]
    const randomness = 5432;

    const fulfullRandomnessCallback = vrfCoordinatorMock.callBackWithRandomness(requestId, randomness, raffleStore.address)
    
    await expect(
      fulfullRandomnessCallback
    ).to.emit(raffleStore, 'RaffleComplete')
      .withArgs(0, rafflePlayer.address);

    await expect(
      fulfullRandomnessCallback
    ).to.emit(testNft, 'Transfer')
      .withArgs(raffleStore.address, rafflePlayer.address, nftId);

    await expect(
      await testNft.ownerOf(nftId)
    ).to.equal(rafflePlayer.address)
  })

  it("Should send ether to raffle creator", async () => {

    await createRaffle();

    let transaction = await raffleStore.connect(rafflePlayer)
      .enterRaffle(0, totalRaffleTickets, {
        value: ticketPrice.mul(totalRaffleTickets)
      })

    const tx_receipt = await transaction.wait()
    const requestId = tx_receipt.events[2].topics[0]
    const randomness = 5432;

    await expect(
      await vrfCoordinatorMock.callBackWithRandomness(requestId, randomness, raffleStore.address)
    ).to.changeEtherBalance(raffleOwner, totalRafflePrice)

  })

  it("Should only allow the raffle creator to cancel the raffle", async () => {
    await createRaffle();

    await expect(
      raffleStore.connect(rafflePlayer).cancelRaffle(0)
      ).to.be.revertedWith("Only the raffle owner can cancel");

    await expect(
      raffleStore.connect(raffleOwner).cancelRaffle(0)
    ).to.not.be.reverted;
  })


  it("Should only cancel ongoing raffles", async () => {
    await createRaffle();
    
    await expect(
      raffleStore.connect(raffleOwner).cancelRaffle(0)
    ).to.not.be.reverted;

    await expect(
      raffleStore.connect(raffleOwner).cancelRaffle(0)
    ).to.be.revertedWith("Raffle is not ongoing");
  })

  it("Should transfer the NFT back to the raffle creator when cancelled", async () => {
    await createRaffle();
    
    await expect(
     raffleStore.connect(raffleOwner).cancelRaffle(0)
    ).to.emit(testNft, 'Transfer').withArgs(
      raffleStore.address, raffleOwner.address, nftId
    )
  })

  it("Should refund the players when cancelled", async () => {
    await createRaffle();

    const addresses = [];
    const balanceChanges = [];

    // let each player buy two tickets
    for(let i = 0; i < totalRaffleTickets.div(2).toNumber()-1; i++){
      addresses.push(rafflePlayers[i]);
      balanceChanges.push(ticketPrice.mul(2));

      await raffleStore.connect(rafflePlayers[i]).enterRaffle(0, 2, {
          value: ticketPrice.mul(2)
      });
    }

    await expect(
      await raffleStore.connect(raffleOwner).cancelRaffle(0)
    ).to.changeEtherBalances(addresses, balanceChanges)
    
  })

  // TODO: test mapping randomness to winner

  // TODO: test concurrent raffles with different price and supply
});
