let { networkConfig } = require('../helper-hardhat-config')


module.exports = async ({
  deployments,
}) => {
  const { deploy } = deployments
  const { deployer } = await getNamedAccounts()

  let Nft = await deploy('Nft', {
    from: deployer,
    log: true
  })
}

module.exports.tags = ['all', 'nft']
