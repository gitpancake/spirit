// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title RejectETH
 * @notice Test contract that rejects ETH transfers (for testing refund fallback)
 */
contract RejectETH {
    bool public acceptingWithdrawals = false;

    // Rejects ETH transfers unless we're in withdrawal mode
    receive() external payable {
        if (!acceptingWithdrawals) {
            revert("RejectETH: Cannot receive ETH");
        }
    }

    // Helper to place bids on auction contract
    function placeBid(address auctionContract, uint256 auctionId) external payable {
        (bool success, ) = auctionContract.call{value: msg.value}(
            abi.encodeWithSignature("bid(uint256)", auctionId)
        );
        require(success, "Bid failed");
    }

    // Helper to withdraw from auction contract
    function withdrawFrom(address auctionContract) external returns (bool) {
        acceptingWithdrawals = true;
        (bool success, ) = auctionContract.call(abi.encodeWithSignature("withdraw()"));
        acceptingWithdrawals = false;
        require(success, "Withdrawal failed");
        return true;
    }

    // Allow contract to receive ETH when calling external functions with calldata
    fallback() external payable {}
}
