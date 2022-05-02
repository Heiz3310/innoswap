const { WETH_ADDRESS } = require("@innoswap/sdk")

module.exports = async function ({ ethers: { getNamedSigner }, getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer, dev } = await getNamedAccounts()

  const chainId = await getChainId()

  const factory = await ethers.getContract("UniswapV2Factory")
  const generator = await ethers.getContract("InnovaeGenerator")
  const innovai = await ethers.getContract("InnovaiToken")
  const wethAddress = "0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6" //rinkeby/ropsten-0xc778417e063141139fce010982780140aa0cd5ab kovan-0xd0a1e359811322d97991e03f863a0c30c2cf029c goerli-0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6
  //let wethAddress;
  
 /* if (chainId === '31337') {
    wethAddress = (await deployments.get("WETH9Mock")).address
  } else if (chainId in WETH_ADDRESS) {
    wethAddress = WETH_ADDRESS[chainId]
  } else {
    throw Error("No WETH!")
  }*/

  await deploy("InnovaiSpawner", {
    from: deployer,
    args: [factory.address, generator.address, innovai.address, wethAddress],
    log: true,
    deterministicDeployment: false
  })

  const spawner = await ethers.getContract("InnovaiSpawner")
  if (await spawner.owner() !== dev) {
    console.log("Setting spawner owner")
    await (await spawner.transferOwnership(dev, true, false)).wait()
  }
}

module.exports.tags = ["InnovaiSpawner"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "InnovaeGenerator", "InnovaiToken"]