//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library GroupManager {
    struct Account {
        address addr;
        int256 balance;
    }

    struct Group {
        bytes32[] nicknames;
        mapping(bytes32 => Account) accounts;
        mapping(bytes32 => bool) existances;
    }

    function add(
        Group storage group,
        bytes32 nickname,
        address addr
    ) internal {
        require(!group.existances[nickname]);
        group.nicknames.push(nickname);
        group.accounts[nickname].addr = addr;
        group.existances[nickname] = true;
    }

    function exists(Group storage group, bytes32 nickname)
        internal
        view
        returns (bool)
    {
        return group.existances[nickname];
    }

    function getBalance(Group storage group, bytes32 nickname)
        internal
        view
        returns (int256)
    {
        return group.accounts[nickname].balance;
    }
}
