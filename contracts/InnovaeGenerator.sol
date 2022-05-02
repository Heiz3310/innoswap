// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// InnovaeGenerator is the coolest generator in town. You come in with some Innovai, and leave with more! The longer you stay, the more Innovai you get.
//
// This contract handles swapping to and from Innovae, InnoSwap's staking token.
contract InnovaeGenerator is ERC20("InnovaeGenerator", "INNAE"){
    using SafeMath for uint256;
    IERC20 public innovai;

    // Define the Innovai token contract
    constructor(IERC20 _innovai) public {
        innovai = _innovai;
    }

    // Enter the generator. Pay some INNAIs. Earn some shares.
    // Locks Innovai and mints Innovae
    function enter(uint256 _amount) public {
        // Gets the amount of Innovai locked in the contract
        uint256 totalInnovai = innovai.balanceOf(address(this));
        // Gets the amount of Innovae in existence
        uint256 totalShares = totalSupply();
        // If no Innovae exists, mint it 1:1 to the amount put in
        if (totalShares == 0 || totalInnovai == 0) {
            _mint(msg.sender, _amount);
        } 
        // Calculate and mint the amount of Innovae the Innovai is worth. The ratio will change overtime, as Innovae is burned/minted and Innovai deposited + gained from fees / withdrawn.
        else {
            uint256 what = _amount.mul(totalShares).div(totalInnovai);
            _mint(msg.sender, what);
        }
        // Lock the Innovai in the contract
        innovai.transferFrom(msg.sender, address(this), _amount);
    }

    // Leave the generator. Claim back your INNAIs.
    // Unlocks the staked + gained Innovai and burns Innovae
    function leave(uint256 _share) public {
        // Gets the amount of Innovae in existence
        uint256 totalShares = totalSupply();
        // Calculates the amount of Innovai the Innovae is worth
        uint256 what = _share.mul(innovai.balanceOf(address(this))).div(totalShares);
        _burn(msg.sender, _share);
        innovai.transfer(msg.sender, what);
    }
}
