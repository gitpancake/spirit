// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title TestERC20
 * @notice Simple vanilla ERC20 contract with pre-minted tokens
 */
contract TestERC20 is ERC20 {
    constructor() ERC20("Test Token", "TEST") {
        // Pre-mint 1 billion tokens to specified address
        address recipient = 0xF7425fB026f9297fCc57B14ace187215442586a2;
        _mint(recipient, 1000000000 * 10 ** 18); // 1 billion tokens with 18 decimals
    }
}
