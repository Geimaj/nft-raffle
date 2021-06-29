
let { networkConfig, getNetworkIdFromName } = require('../helper-hardhat-config')

task("mint-nft", "Mints NFTs and sends to owner address")
    .addParam("address", "The address the NFTs should be sent to")
    .setAction(async (taskArgs) => {
        const ownerAddress = taskArgs.address
        const TestNft = await deployments.get('Nft')
        testNft = await ethers.getContractAt('Nft', TestNft.address)

        for(let i = 0; i < 10; i++){
          await testNft.mint(ownerAddress, i).then(function (transaction) {
            console.log('NFT minted ', i)
          })
        }
    })

module.exports = {}

