
task("fund-eth", "Mints NFTs and sends to owner address")
    .addParam("address", "The address the NFTs should be sent to")
    .setAction(async (taskArgs) => {
        const address = taskArgs.address
        const [deployer] = await ethers.getSigners();

        const value = ethers.utils.parseEther('1');

        await deployer.sendTransaction({to: address, value})
    })

module.exports = {}

