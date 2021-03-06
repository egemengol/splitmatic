// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../libraries/GroupManager.sol";

contract Splitmatic {
    GroupManager.Group group;
    IERC20 token;

    constructor(address tokenAddress, address[] memory addresses, bytes32[] memory nicknames) {
        _addParticipants(addresses, nicknames);
        token = IERC20(tokenAddress);
    }

    modifier onlyParticipants {
        require(GroupManager.exists(group, msg.sender), "Only participants can perform this action");
        _;
    }

    function addParticipants(
        address[] memory addresses,
        bytes32[] memory nicknames
    ) public onlyParticipants {
        _addParticipants(addresses, nicknames);
    }

    function _addParticipants(
        address[] memory addresses,
        bytes32[] memory nicknames
    ) internal {
        require(
            addresses.length == nicknames.length,
            "Array lengths do not match!"
        );
        for (uint256 i = 0; i < addresses.length; i++) {
            GroupManager.add(group, addresses[i], nicknames[i]);
        }
    }

    function isParticipant(address addr) public view returns (bool) {
        return GroupManager.exists(group, addr);
    }

    function balanceOf(address addr) public view returns(uint256, uint256) {
        return GroupManager.getBalance(group, addr);
    }

    function spend(address recipient, uint256[] calldata charges) public onlyParticipants {
        uint amount = GroupManager.spend(group, msg.sender, charges);
        token.transferFrom(msg.sender, recipient, amount);
    }

    function settle() public onlyParticipants {
        uint256 contractBalance = token.balanceOf(address(this));
        (uint256 amount, bool outBound) = GroupManager.settle(group, contractBalance, msg.sender);
        if (amount != 0) {
            if (outBound) {
                token.transfer(msg.sender, amount);
            } else {
                token.transferFrom(msg.sender, address(this), amount);
            }
        }
    }
}
