// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "@openzeppelin/contracts/interfaces/draft-IERC6093.sol";
import "../src/AIAgent.sol";

contract AIAgentTest is Test {
    AIAgent public aiAgent;
    address public user = address(0x1);

    function setUp() public {
        vm.startPrank(address(this));
        aiAgent = new AIAgent(address(this));
        vm.stopPrank();
    }

    function testMintAgent() public {
        vm.prank(address(this));
        uint256 tokenId = aiAgent.mint(user, AIAgent.Skill.WOODCUTTING);
        assertEq(aiAgent.ownerOf(tokenId), user);
    }

    function testGetAgentSkill() public {
        vm.prank(address(this));
        uint256 tokenId = aiAgent.mint(user, AIAgent.Skill.MINING);
        AIAgent.Skill skill = aiAgent.getAgentSkill(tokenId);
        assertEq(uint(skill), uint(AIAgent.Skill.MINING));
    }

    function testGetSkillOfNonExistentAgent() public {
        vm.expectRevert(abi.encodeWithSelector(IERC721Errors.ERC721NonexistentToken.selector, 999));
        aiAgent.getAgentSkill(999);
    }
}
