// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
contract AIAgent is ERC721Enumerable, Ownable {
    uint256 private _tokenIdCounter;

    // Enum for different skills an agent can have
    enum Skill { 
        NONE,
        MINING,
        WOODCUTTING,
        FISHING
    }

    // Struct to hold agent-specific data
    struct Agent {
        uint256 tokenId;
        Skill skill;
    }

    // Mapping from token ID to Agent data
    mapping(uint256 => Agent) public agents;

    constructor(address initialOwner) ERC721("Somnia Agent", "SAI") Ownable(initialOwner) {}

    function mint(address to, Skill skill) public returns (uint256) {
        _tokenIdCounter++;
        uint256 tokenId = _tokenIdCounter;
        _safeMint(to, tokenId);

        agents[tokenId] = Agent({
            tokenId: tokenId,
            skill: skill
        });

        return tokenId;
    }

    function getAgentSkill(uint256 tokenId) public view returns (Skill) {
        ownerOf(tokenId); // Reverts if token does not exist, effectively checking existence.
        return agents[tokenId].skill;
    }

    function totalSupply() public view override returns (uint256) {
        return _tokenIdCounter;
    }
}
