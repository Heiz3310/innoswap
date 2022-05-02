import { ethers } from "hardhat";
const { keccak256, defaultAbiCoder } = require("ethers");
import { expect } from "chai";
import { prepare, deploy, getBigNumber, createILP } from "./utilities"

describe("NovaInnovaiSpawner", function () {
  before(async function () {
    await prepare(this, ["InnovaiSpawnerNova", "InnovaeGenerator", "InnovaiSpawnerNovaExploitMock", "ERC20Mock", "UniswapV2Factory", "UniswapV2Pair", "BreadBoxV1", "NovaPairMediumRiskV1", "PeggedOracleV1"])
  })

  beforeEach(async function () {
    // Deploy ERC20 Mocks and Factory
    await deploy(this, [
      ["innovai", this.ERC20Mock, ["INNAI", "INNAI", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.UniswapV2Factory, [this.alice.address]],
    ])
    // Deploy Innovai and Nova contracts
    await deploy(this, [["generator", this.InnovaeGenerator, [this.innovai.address]]])
    await deploy(this, [["bread", this.BreadBoxV1, [this.weth.address]]])
    await deploy(this, [["novaMaster", this.NovaPairMediumRiskV1, [this.bread.address]]])
    await deploy(this, [["novaSpawner", this.InnovaiSpawnerNova, [this.factory.address, this.generator.address, this.bread.address, this.innovai.address, this.weth.address, this.factory.pairCodeHash()]]])
    await deploy(this, [["exploiter", this.InnovaiSpawnerNovaExploitMock, [this.novaSpawner.address]]])
    await deploy(this, [["oracle", this.PeggedOracleV1]])
    // Create ILPs
    await createILP(this, "innovaiEth", this.innovai, this.weth, getBigNumber(10))
    await createILP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createILP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createILP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createILP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createILP(this, "innovaiUSDC", this.innovai, this.usdc, getBigNumber(10))
    await createILP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createILP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
    // Set Nova fees to Spawner
    await this.novaMaster.setFeeTo(this.novaSpawner.address)
    // Whitelist Nova on Bread
    await this.bread.whitelistMasterContract(this.novaMaster.address, true)
    // Approve and make Bread token deposits
    await this.innovai.approve(this.bread.address, getBigNumber(10))
    await this.dai.approve(this.bread.address, getBigNumber(10))
    await this.mic.approve(this.bread.address, getBigNumber(10))
    await this.usdc.approve(this.bread.address, getBigNumber(10))
    await this.weth.approve(this.bread.address, getBigNumber(10))
    await this.strudel.approve(this.bread.address, getBigNumber(10))
    await this.bread.deposit(this.innovai.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.bread.deposit(this.dai.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.bread.deposit(this.mic.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.bread.deposit(this.usdc.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.bread.deposit(this.weth.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    await this.bread.deposit(this.strudel.address, this.alice.address, this.alice.address, getBigNumber(10), 0)
    // Approve Nova to spend 'alice' Bread tokens
    await this.bread.setMasterContractApproval(this.alice.address, this.novaMaster.address, true, "0", "0x0000000000000000000000000000000000000000000000000000000000000000", "0x0000000000000000000000000000000000000000000000000000000000000000")
    // **TO-DO - Initialize Nova Pair**
    //const oracleData = await this.oracle.getDataParameter("1")
    //const initData = defaultAbiCoder.encode(["address", "address", "address", "bytes"], [this.innovai.address, this.dai.address, this.oracle.address, oracleData])
    //await this.bread.deploy(this.NovaMaster.address, initData, true)
  })

  describe("setBridge", function () {
    it("only allows the owner to set bridge", async function () {
      await expect(this.novaSpawner.connect(this.bob).setBridge(this.innovai.address, this.weth.address, { from: this.bob.address })).to.be.revertedWith("Ownable: caller is not the owner")
    })
    
    it("does not allow to set bridge for Innovai", async function () {
      await expect(this.novaSpawner.setBridge(this.innovai.address, this.weth.address)).to.be.revertedWith("Spawner: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.novaSpawner.setBridge(this.weth.address, this.innovai.address)).to.be.revertedWith("Spawner: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.novaSpawner.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("Spawner: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.novaSpawner.setBridge(this.dai.address, this.innovai.address))
        .to.emit(this.novaSpawner, "LogBridgeSet")
        .withArgs(this.dai.address, this.innovai.address)
    })
  })
  
  describe("convert", function () {
    it("reverts if caller is not EOA", async function () {
      await expect(this.exploiter.convert(this.innovai.address)).to.be.revertedWith("Spawner: Must use EOA")
    })
  })
})
