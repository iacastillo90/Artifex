// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC token para pruebas locales
 */
contract MockUSDC is ERC20, Ownable {
    constructor(address initialOwner)
        ERC20("USD Coin", "USDC")
        Ownable(initialOwner)
    {
        // Mintear supply inicial para testing
        _mint(initialOwner, 1000000 * 10**6); // 1M USDC
    }

    function decimals() public pure override returns (uint8) {
        return 6; // USDC tiene 6 decimales
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
