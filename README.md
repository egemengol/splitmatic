# Splitmatic

Splitmatic is a port of Splitwise, in solidity.  
It does not try to be feature complete for this version, it is intended to be a learning project.

It includes:
- A Solidity library for core logic
- Access control (therefore separation of concerns)
- Utilization of `approve` function from ERC20.
- Tests, written in Typescript
- A Github action for tests: ![test results](https://github.com/egemengol/splitmatic/actions/workflows/commit.yml/badge.svg)

## Features
- Participants can be added to the group by other participants anytime.
- Participants have nicknames, persisted by the contract.
- Payments are done with a ERC20 token, which is determined on contract creation.

## Usage
Participants enter any spending by supplying an array of charges, which represents the actual value every participant received from the spending.  

If an actor with more debt than expenditure decides to settle, the difference is transferred to the contract.

If an actor with more expenditure than debt decides to settle, the amount is transferred from contract to that actor's account. If the funds are insufficient, the actor gets whatever they can, with the remaining due amount is still in effect.

For an example, you can check [*this document*](./EXAMPLE.md) out.

## Design Choices
- Separating the core logic from the access control benefitted the readability of the contract, at the same time allowing us to apply the DRY principle. Also, the core logic does not interact with the `ERC20` token at all.
- An account holds `debt` and `owed` together, which are strictly non-decreasing on every `spend` action. In this way, we can follow everybody's financial situation cheaply, without remembering `N^2` information. When a person spends, `debt` and `owed` fields can increase at the same time.

## How to run the tests

```bash
yarn
npx hardhat 
```

## License
[MIT](https://choosealicense.com/licenses/mit/)