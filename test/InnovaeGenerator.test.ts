import { ethers } from "hardhat";
import { expect } from "chai";

describe("InnovaeGenerator", function () {
  before(async function () {
    this.InnovaiToken = await ethers.getContractFactory("InnovaiToken")
    this.InnovaeGenerator = await ethers.getContractFactory("InnovaeGenerator")

    this.signers = await ethers.getSigners()
    this.alice = this.signers[0]
    this.bob = this.signers[1]
    this.carol = this.signers[2]
  })

  beforeEach(async function () {
    this.innovai = await this.InnovaiToken.deploy()
    this.generator = await this.InnovaeGenerator.deploy(this.innovai.address)
    this.innovai.mint(this.alice.address, "100")
    this.innovai.mint(this.bob.address, "100")
    this.innovai.mint(this.carol.address, "100")
  })

  it("should not allow enter if not enough approve", async function () {
    await expect(this.generator.enter("100")).to.be.revertedWith("ERC20: transfer amount exceeds allowance")
    await this.innovai.approve(this.generator.address, "50")
    await expect(this.generator.enter("100")).to.be.revertedWith("ERC20: transfer amount exceeds allowance")
    await this.innovai.approve(this.generator.address, "100")
    await this.generator.enter("100")
    expect(await this.generator.balanceOf(this.alice.address)).to.equal("100")
  })

  it("should not allow withraw more than what you have", async function () {
    await this.innovai.approve(this.generator.address, "100")
    await this.generator.enter("100")
    await expect(this.generator.leave("200")).to.be.revertedWith("ERC20: burn amount exceeds balance")
  })

  it("should work with more than one participant", async function () {
    await this.innovai.approve(this.generator.address, "100")
    await this.innovai.connect(this.bob).approve(this.generator.address, "100", { from: this.bob.address })
    // Alice enters and gets 20 shares. Bob enters and gets 10 shares.
    await this.generator.enter("20")
    await this.generator.connect(this.bob).enter("10", { from: this.bob.address })
    expect(await this.generator.balanceOf(this.alice.address)).to.equal("20")
    expect(await this.generator.balanceOf(this.bob.address)).to.equal("10")
    expect(await this.innovai.balanceOf(this.generator.address)).to.equal("30")
    // InnovaeGenerator get 20 more INNAIs from an external source.
    await this.innovai.connect(this.carol).transfer(this.generator.address, "20", { from: this.carol.address })
    // Alice deposits 10 more INNAIs. She should receive 10*30/50 = 6 shares.
    await this.generator.enter("10")
    expect(await this.generator.balanceOf(this.alice.address)).to.equal("26")
    expect(await this.generator.balanceOf(this.bob.address)).to.equal("10")
    // Bob withdraws 5 shares. He should receive 5*60/36 = 8 shares
    await this.generator.connect(this.bob).leave("5", { from: this.bob.address })
    expect(await this.generator.balanceOf(this.alice.address)).to.equal("26")
    expect(await this.generator.balanceOf(this.bob.address)).to.equal("5")
    expect(await this.innovai.balanceOf(this.generator.address)).to.equal("52")
    expect(await this.innovai.balanceOf(this.alice.address)).to.equal("70")
    expect(await this.innovai.balanceOf(this.bob.address)).to.equal("98")
  })
})
