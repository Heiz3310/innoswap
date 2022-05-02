module.exports = async function ({ getNamedAccounts, deployments }) {
  const { deploy } = deployments

  const { deployer } = await getNamedAccounts()

  const innovai = await deployments.get("InnovaiToken")

  await deploy("InnovaeGenerator", {
    from: deployer,
    args: [innovai.address],
    log: true,
    deterministicDeployment: false
  })
}

module.exports.tags = ["InnovaeGenerator"]
module.exports.dependencies = ["UniswapV2Factory", "UniswapV2Router02", "InnovaiToken"]
