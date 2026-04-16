// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FailingTransferContract {
    // This contract will fail all ETH and ERC-20 transfers
    // Used to test failed transfer scenarios in coverage

    receive() external payable {
        // Revert all ETH transfers
        revert("ETH transfer failed");
    }

    fallback() external payable {
        // Revert all fallback calls
        revert("Fallback failed");
    }

    // Function to receive ERC-20 tokens but fail transfers
    function transfer(address to, uint256 amount) external pure returns (bool) {
        // Always fail transfers
        revert("ERC-20 transfer failed");
    }

    // Function to approve but fail transfers
    function approve(address spender, uint256 amount) external pure returns (bool) {
        // Always fail approvals
        revert("ERC-20 approval failed");
    }
}
