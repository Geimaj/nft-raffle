exports.createRaffle = async () => {
  const totalRafflePrice = ethers.utils.parseUnits('1', "ether");
  const totalRaffleTickets = ethers.BigNumber.from('10');
  const ticketPrice =  ethers.BigNumber.from(totalRafflePrice).div(totalRaffleTickets);
  const nftId = 1;
  let [deployer, raffleOwner, rafflePlayer] = await ethers.getSigners()

  const RaffleStore = await deployments.get('RaffleStore')
  let raffleStore = await ethers.getContractAt('RaffleStore', RaffleStore.address)

  const TestNft = await deployments.get('Nft')
  let testNft = await ethers.getContractAt('Nft', TestNft.address)

  await testNft.connect(raffleOwner).approve(raffleStore.address, nftId)
  await raffleStore.connect(raffleOwner).createRaffle(testNft.address, nftId, totalRaffleTickets, totalRafflePrice);
}