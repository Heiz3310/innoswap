import { expect } from "chai";
import { prepare, deploy, getBigNumber, createILP } from "./utilities"

describe("InnovaiSpawner", function () {
  before(async function () {
    await prepare(this, ["InnovaiSpawner", "InnovaeGenerator", "InnovaiSpawnerExploitMock", "ERC20Mock", "UniswapV2Factory", "UniswapV2Pair"])
  })

  beforeEach(async function () {
    await deploy(this, [
      ["innovai", this.ERC20Mock, ["INNAI", "INNAI", getBigNumber("10000000")]],
      ["dai", this.ERC20Mock, ["DAI", "DAI", getBigNumber("10000000")]],
      ["mic", this.ERC20Mock, ["MIC", "MIC", getBigNumber("10000000")]],
      ["usdc", this.ERC20Mock, ["USDC", "USDC", getBigNumber("10000000")]],
      ["weth", this.ERC20Mock, ["WETH", "ETH", getBigNumber("10000000")]],
      ["strudel", this.ERC20Mock, ["$TRDL", "$TRDL", getBigNumber("10000000")]],
      ["factory", this.UniswapV2Factory, [this.alice.address]],
    ])
    await deploy(this, [["generator", this.InnovaeGenerator, [this.innovai.address]]])
    await deploy(this, [["innovaiSpawner", this.InnovaiSpawner, [this.factory.address, this.generator.address, this.innovai.address, this.weth.address]]])
    await deploy(this, [["exploiter", this.InnovaiSpawnerExploitMock, [this.innovaiSpawner.address]]])
    await createILP(this, "innovaiEth", this.innovai, this.weth, getBigNumber(10))
    await createILP(this, "strudelEth", this.strudel, this.weth, getBigNumber(10))
    await createILP(this, "daiEth", this.dai, this.weth, getBigNumber(10))
    await createILP(this, "usdcEth", this.usdc, this.weth, getBigNumber(10))
    await createILP(this, "micUSDC", this.mic, this.usdc, getBigNumber(10))
    await createILP(this, "innovaiUSDC", this.innovai, this.usdc, getBigNumber(10))
    await createILP(this, "daiUSDC", this.dai, this.usdc, getBigNumber(10))
    await createILP(this, "daiMIC", this.dai, this.mic, getBigNumber(10))
  })
  describe("setBridge", function () {
    it("does not allow to set bridge for Innovai", async function () {
      await expect(this.innovaiSpawner.setBridge(this.innovai.address, this.weth.address)).to.be.revertedWith("InnovaiSpawner: Invalid bridge")
    })

    it("does not allow to set bridge for WETH", async function () {
      await expect(this.innovaiSpawner.setBridge(this.weth.address, this.innovai.address)).to.be.revertedWith("InnovaiSpawner: Invalid bridge")
    })

    it("does not allow to set bridge to itself", async function () {
      await expect(this.innovaiSpawner.setBridge(this.dai.address, this.dai.address)).to.be.revertedWith("InnovaiSpawner: Invalid bridge")
    })

    it("emits correct event on bridge", async function () {
      await expect(this.innovaiSpawner.setBridge(this.dai.address, this.innovai.address))
        .to.emit(this.innovaiSpawner, "LogBridgeSet")
        .withArgs(this.dai.address, this.innovai.address)
    })
  })
  describe("convert", function () {
    it("should convert INNAI - ETH", async function () {
      await this.innovaiEth.transfer(this.innovaiSpawner.address, getBigNumber(1))
      await this.innovaiSpawner.convert(this.innovai.address, this.weth.address)
      expect(await this.innovai.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.innovaiEth.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.innovai.balanceOf(this.generator.address)).to.equal("1897569270781234370")
    })

    it("should convert USDC - ETH", async function () {
      await this.usdcEth.transfer(this.innovaiSpawner.address, getBigNumber(1))
      await this.innovaiSpawner.convert(this.usdc.address, this.weth.address)
      expect(await this.innovai.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.usdcEth.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.innovai.balanceOf(this.generator.address)).to.equal("1590898251382934275")
    })

    it("should convert $TRDL - ETH", async function () {
      await this.strudelEth.transfer(this.innovaiSpawner.address, getBigNumber(1))
      await this.innovaiSpawner.convert(this.strudel.address, this.weth.address)
      expect(await this.innovai.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.strudelEth.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.innovai.balanceOf(this.generator.address)).to.equal("1590898251382934275")
    })

    it("should convert USDC - INNAI", async function () {
      await this.innovaiUSDC.transfer(this.innovaiSpawner.address, getBigNumber(1))
      await this.innovaiSpawner.convert(this.usdc.address, this.innovai.address)
      expect(await this.innovai.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.innovaiUSDC.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.innovai.balanceOf(this.generator.address)).to.equal("1897569270781234370")
    })

    it("should convert using standard ETH path", async function () {
      await this.daiEth.transfer(this.innovaiSpawner.address, getBigNumber(1))
      await this.innovaiSpawner.convert(this.dai.address, this.weth.address)
      expect(await this.innovai.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.innovai.balanceOf(this.generator.address)).to.equal("1590898251382934275")
    })

    it("converts MIC/USDC using more complex path", async function () {
      await this.micUSDC.transfer(this.innovaiSpawner.address, getBigNumber(1))
      await this.innovaiSpawner.setBridge(this.usdc.address, this.innovai.address)
      await this.innovaiSpawner.setBridge(this.mic.address, this.usdc.address)
      await this.innovaiSpawner.convert(this.mic.address, this.usdc.address)
      expect(await this.innovai.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.innovai.balanceOf(this.generator.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/USDC using more complex path", async function () {
      await this.daiUSDC.transfer(this.innovaiSpawner.address, getBigNumber(1))
      await this.innovaiSpawner.setBridge(this.usdc.address, this.innovai.address)
      await this.innovaiSpawner.setBridge(this.dai.address, this.usdc.address)
      await this.innovaiSpawner.convert(this.dai.address, this.usdc.address)
      expect(await this.innovai.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.daiUSDC.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.innovai.balanceOf(this.generator.address)).to.equal("1590898251382934275")
    })

    it("converts DAI/MIC using two step path", async function () {
      await this.daiMIC.transfer(this.innovaiSpawner.address, getBigNumber(1))
      await this.innovaiSpawner.setBridge(this.dai.address, this.usdc.address)
      await this.innovaiSpawner.setBridge(this.mic.address, this.dai.address)
      await this.innovaiSpawner.convert(this.dai.address, this.mic.address)
      expect(await this.innovai.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.daiMIC.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.innovai.balanceOf(this.generator.address)).to.equal("1200963016721363748")
    })

    it("reverts if it loops back", async function () {
      await this.daiMIC.transfer(this.innovaiSpawner.address, getBigNumber(1))
      await this.innovaiSpawner.setBridge(this.dai.address, this.mic.address)
      await this.innovaiSpawner.setBridge(this.mic.address, this.dai.address)
      await expect(this.innovaiSpawner.convert(this.dai.address, this.mic.address)).to.be.reverted
    })

    it("reverts if caller is not EOA", async function () {
      await this.innovaiEth.transfer(this.innovaiSpawner.address, getBigNumber(1))
      await expect(this.exploiter.convert(this.innovai.address, this.weth.address)).to.be.revertedWith("InnovaiSpawner: must use EOA")
    })

    it("reverts if pair does not exist", async function () {
      await expect(this.innovaiSpawner.convert(this.mic.address, this.micUSDC.address)).to.be.revertedWith("InnovaiSpawner: Invalid pair")
    })

    it("reverts if no path is available", async function () {
      await this.micUSDC.transfer(this.innovaiSpawner.address, getBigNumber(1))
      await expect(this.innovaiSpawner.convert(this.mic.address, this.usdc.address)).to.be.revertedWith("InnovaiSpawner: Cannot convert")
      expect(await this.innovai.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.micUSDC.balanceOf(this.innovaiSpawner.address)).to.equal(getBigNumber(1))
      expect(await this.innovai.balanceOf(this.generator.address)).to.equal(0)
    })
  })

  describe("convertMultiple", function () {
    it("should allow to convert multiple", async function () {
      await this.daiEth.transfer(this.innovaiSpawner.address, getBigNumber(1))
      await this.innovaiEth.transfer(this.innovaiSpawner.address, getBigNumber(1))
      await this.innovaiSpawner.convertMultiple([this.dai.address, this.innovai.address], [this.weth.address, this.weth.address])
      expect(await this.innovai.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.daiEth.balanceOf(this.innovaiSpawner.address)).to.equal(0)
      expect(await this.innovai.balanceOf(this.generator.address)).to.equal("3186583558687783097")
    })
  })
})
