//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library GroupManager {
    struct Account {
        bytes32 nickname;
        uint256 debt;
        uint256 owed;
    }

    struct Group {
        address[] addresses;
        mapping(address => Account) accounts;
        mapping(bytes32 => address) nick2Addr;
    }

    function add(
        Group storage group,
        address addr,
        bytes32 nickname
    ) internal {
        require(nickname != bytes32(0));
        require(!GroupManager.exists(group, addr));
        
        group.addresses.push(addr);
        group.accounts[addr].nickname = nickname;
        group.nick2Addr[nickname] = addr;
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
        returns (uint256, uint256)
    {
        return (group.accounts[addr].owed, group.accounts[addr].debt);
    }

    function spend(Group storage group, address spender, uint256[] calldata charges) internal returns(uint256) {
        require(charges.length == group.addresses.length, "Nof charges do not match nof participants!");
        uint owed;
        for (uint i=0; i<charges.length; i++) {
            owed += charges[i];
            group.accounts[group.addresses[i]].debt += charges[i];
        }
        group.accounts[spender].owed += owed;
        return owed;
    }

    function settle(Group storage group, uint256 contractBalance, address caller) internal returns(uint256, bool) {
        // Returns: (amount, isOutbound)
        (uint256 owed, uint256 debt) = GroupManager.getBalance(group, caller);
        if (debt > owed) {
            group.accounts[msg.sender].debt = 0;
            group.accounts[msg.sender].owed = 0;
            return (debt - owed, false);
        } else if (owed > debt) {
            uint256 willReceive = owed - debt;
            if (willReceive > contractBalance) {
                willReceive = contractBalance; 
            }
            group.accounts[msg.sender].owed -= willReceive + debt;
            group.accounts[msg.sender].debt = 0;
            return (willReceive, true);
        } else {
            return (0, true);
        }
    }
}
