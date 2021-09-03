// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../libraries/GroupManager.sol";

contract Splitmatic {
    GroupManager.Group group;

    constructor(bytes32[] memory nicknames, address[] memory addresses) {
        addParticipants(nicknames, addresses);
    }

    function addParticipants(
        bytes32[] memory nicknames,
        address[] memory addresses
    ) public {
        require(
            addresses.length == nicknames.length,
            "Array lengths do not match!"
        );
        for (uint256 i = 0; i < addresses.length; i++) {
            GroupManager.add(group, nicknames[i], addresses[i]);
        }
    }

    function isParticipant(bytes32 nickname) public view returns (bool) {
        return GroupManager.exists(group, nickname);
    }

    function getAllNicknames() public view returns (bytes32[] memory) {
        return group.nicknames;
    }

    function getBalance(bytes32 nickname) public view returns(int256) {
        return GroupManager.getBalance(group, nickname);
    }
}
