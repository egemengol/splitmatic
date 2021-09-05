//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library GroupManager {
    struct Account {
        bytes32 nickname;
        int256 balance;
    }

    struct Group {
        mapping(address => Account) accounts;
        mapping(bytes32 => address) nick2Addr;
        bytes32[] nicknames;
    }

    function add(
        Group storage group,
        address addr,
        bytes32 nickname
    ) internal {
        require(nickname != bytes32(0));
        require(!GroupManager.exists(group, addr));
        
        group.nick2Addr[nickname] = addr;
        group.accounts[addr].nickname = nickname;
        group.nicknames.push(nickname);
    }

    function exists(Group storage group, address addr)
        internal
        view
        returns (bool)
    {
        return group.accounts[addr].nickname != bytes32(0);
    }

    function getBalance(Group storage group, address addr)
        internal
        view
        returns (int256)
    {
        return group.accounts[addr].balance;
    }
}
