module.exports = async function ({ ethers, deployments, getNamedAccounts }) {
  const { deploy } = deployments

  const { deployer, dev } = await getNamedAccounts()

  const innovai = await ethers.getContract("InnovaiToken")
  
  const { address } = await deploy("MasterDeveloper", {
    from: deployer,
    args: [innovai.address, dev, "10485850", "100", "10481850"],
    log: true,
    deterministicDeployment: false
  })

  /*if (await innovai.owner() !== address) {
    // Transfer Innovai Ownership to Developer
    console.log("Transfer Innovai Ownership to Developer")
    await (await innovai.transferOwnership(address)).wait()
  }*/

  const masterDeveloper = await ethers.getContract("MasterDeveloper")
  if (await masterDeveloper.owner() !== dev) {
    // Transfer ownership of MasterDeveloper to dev
    console.log("Transfer ownership of MasterDeveloper to dev")
    await (await masterDeveloper.transferOwnership(dev)).wait()
  }
}

module.exports.tags = ["MasterDeveloper"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "InnovaiToken"]
