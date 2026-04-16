// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title TestNFT
 * @notice Simple vanilla ERC721 contract with pre-minted tokens
 */
contract TestNFT is ERC721 {
    string private _baseTokenURI;

    constructor() ERC721("Test NFT Collection", "TNFT") {
        _baseTokenURI = "ipfs://bafybeie6vszbj5aqfwzcl3f4thse23at7jvtto6m4wmkfs5urnuppybvre/";

        // Pre-mint to Eden testnet addresses (starting from token ID 0)
        _mint(0x4351fF96cE1fA09B7eF08BCEF9bDAA753eF9674E, 0); // Eden testnet vault
        _mint(0xc6fA64A9Dea97d4CB80Ed76007Cf3eb8ef4C6917, 1); // Eden testnet normal wallet
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev Override tokenURI to return baseURI/tokenId.json format
     * @param tokenId The token ID to get the URI for
     * @return The complete metadata URI
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);

        string memory base = _baseURI();
        return
            bytes(base).length > 0
                ? string(abi.encodePacked(base, _toString(tokenId), ".json"))
                : "";
    }

    /**
     * @dev Convert a uint256 to its ASCII string decimal representation
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}
