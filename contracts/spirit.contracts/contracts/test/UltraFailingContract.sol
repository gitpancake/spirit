// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract UltraFailingContract {
    // This contract will fail all ETH and ERC-20 transfers in specific ways
    // Used to test the exact failure scenarios needed for branch coverage

    bool public shouldFail = true;

    // Function to control failure behavior
    function setShouldFail(bool _shouldFail) external {
        shouldFail = _shouldFail;
    }

    receive() external payable {
        // Always fail ETH transfers
        if (shouldFail) {
            revert("ETH transfer failed");
        }
    }

    fallback() external payable {
        // Always fail fallback calls
        if (shouldFail) {
            revert("Fallback failed");
        }
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

    // Function to simulate a contract that can receive but not send
    function onERC20Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure returns (bytes4) {
        return this.onERC20Received.selector;
    }
}
