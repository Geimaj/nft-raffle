let { networkConfig } = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments, getChainId }) => {
  const { deploy, get, log } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = (await getChainId()) || 1337;
  let linkTokenAddress;
  let vrfCoordinatorAddress;
  let additionalMessage = "";

  // deploy chainlink deps
  if (chainId == 1337) {
    linkToken = await get("LinkToken");
    VRFCoordinatorMock = await get("VRFCoordinatorMock");
    linkTokenAddress = linkToken.address;
    vrfCoordinatorAddress = VRFCoordinatorMock.address;
    additionalMessage = " --linkaddress " + linkTokenAddress;
  } else {
    linkTokenAddress = networkConfig[chainId]["linkToken"];
    vrfCoordinatorAddress = networkConfig[chainId]["vrfCoordinator"];
  }
  const keyHash = networkConfig[chainId]["keyHash"];
  const fee = networkConfig[chainId]["fee"];

  // deploy raffle store
  const raffleStore = await deploy("RaffleStore", {
    from: deployer,
    args: [vrfCoordinatorAddress, linkTokenAddress, fee, keyHash],
    log: true,
  });

  await hre.run("fund-link", {
    contract: raffleStore.address,
    network: networkConfig[chainId]["name"],
    linkaddress: linkTokenAddress,
  });
};

module.exports.tags = ["all", "raffleStore"];
