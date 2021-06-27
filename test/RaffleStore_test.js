const { expect } = require("chai");
require('dotenv').config();
let { networkConfig } = require('../helper-hardhat-config')


describe("RaffleStore", function () {
  let raffleStore;
  let testNft;
  let deployer;
  let raffleOwner;
  let rafflePlayer;
  let vrfCoordinatorMock;
  const nftId = 1;
  const totalRafflePrice = ethers.utils.parseUnits('1', "ether");
  const totalRaffleTickets = ethers.BigNumber.from('10');
  const ticketPrice =  ethers.BigNumber.from(totalRafflePrice).div(totalRaffleTickets);

  beforeEach(async () => {
    await deployments.fixture(['mocks', 'vrf', 'raffleStore', 'nft']);
    [deployer, raffleOwner, rafflePlayer] = await ethers.getSigners()

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
    await testNft.connect(raffleOwner).approve(raffleStore.address, nftId)
    await raffleStore.connect(raffleOwner).createRaffle(testNft.address, nftId, totalRaffleTickets, totalRafflePrice);

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, totalRaffleTickets.add(1))
    ).to.be.revertedWith('Not enough tickets available')

    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 
        totalRaffleTickets.sub('1'), {
        value: ticketPrice.mul(totalRaffleTickets.add('-1'))
      })
    ).to.be.satisfy

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
    ).to.be.satisfy
    
    await expect(
      raffleStore.connect(rafflePlayer).enterRaffle(0, 1)
    ).to.be.revertedWith('Raffle no longer active')
  })

  it("Should check the eth deposit matches the ticket price", async () => {
    await testNft.connect(raffleOwner).approve(raffleStore.address, nftId)
    await raffleStore.connect(raffleOwner).createRaffle(testNft.address, nftId, totalRaffleTickets, totalRafflePrice);
    
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
  })

  it("Should choose a winner when the last ticket is purchased", async () => {
    await testNft.connect(raffleOwner).approve(raffleStore.address, nftId)
    await raffleStore.connect(raffleOwner).createRaffle(testNft.address, nftId, totalRaffleTickets, totalRafflePrice);
    
    // TODO: check link was sent to vrfCoordinator
    // const LinkToken = await deployments.get('LinkToken')
    // linkToken = await ethers.getContractAt('LinkToken', LinkToken.address)

    // await expect(
    //   raffleStore.connect(rafflePlayer).enterRaffle(0, totalRaffleTickets, {
    //     value: ticketPrice.mul(totalRaffleTickets)
    //   })
    // ).to.changeTokenBalances(
    //   linkToken,
    //   [raffleStore, vrfCoordinatorMock],
    //   [-200, 200]
    // );

    await raffleStore.connect(rafflePlayer).enterRaffle(0, totalRaffleTickets, {
      value: ticketPrice.mul(totalRaffleTickets)
    })

    await expect(
      (await raffleStore.raffles(0)).status
    ).to.equal(1)

  })

  it("Should not sell tickets while the raffle is pending completion", async () => {
    await testNft.connect(raffleOwner).approve(raffleStore.address, nftId)
    await raffleStore.connect(raffleOwner).createRaffle(testNft.address, nftId, totalRaffleTickets, totalRafflePrice);

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
    await testNft.connect(raffleOwner).approve(raffleStore.address, nftId)
    await raffleStore.connect(raffleOwner).createRaffle(testNft.address, nftId, totalRaffleTickets, totalRafflePrice);

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

  it("Send ether to raffle creator", async () => {

    await testNft.connect(raffleOwner).approve(raffleStore.address, nftId)
    await raffleStore.connect(raffleOwner).createRaffle(testNft.address, nftId, totalRaffleTickets, totalRafflePrice);

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


});
