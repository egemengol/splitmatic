// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/GroupManager.sol";

contract Splitmatic {
    GroupManager.Group group;

    constructor(address[] memory addresses, bytes32[] memory nicknames) {
        addParticipants(addresses, nicknames);
    }

    function addParticipants(
        address[] memory addresses,
        bytes32[] memory nicknames
    ) public {
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

    function getAllNicknames() public view returns (bytes32[] memory) {
        return group.nicknames;
    }

    function getBalance(address addr) public view returns(int256) {
        return GroupManager.getBalance(group, addr);
    }
}
