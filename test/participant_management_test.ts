import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Splitmatic } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { utils } from 'ethers';

describe('Participant Management', function () {
	let accounts: SignerWithAddress[];
	let deployer: SignerWithAddress;
	const deployerNick = utils.formatBytes32String('deployer');
	const accountNick = (index: number) => utils.formatBytes32String(`account${index}`);

	let splitmatic: Splitmatic;

	beforeEach(async function () {
		[deployer, ...accounts] = await ethers.getSigners();

		const splitmaticFactory = await ethers.getContractFactory('Splitmatic');
		splitmatic = await splitmaticFactory.deploy([deployerNick], [deployer.address]);
	});

	it('child should have one participant', async function () {
		expect(await splitmatic.isParticipant(deployerNick));
		expect(!(await splitmatic.isParticipant(accountNick(0))));
	});

	it('can add participants later', async function () {
		expect(await splitmatic.isParticipant(deployerNick));
		expect(!(await splitmatic.isParticipant(accountNick(0))));
		expect(!(await splitmatic.isParticipant(accountNick(1))));
		expect(!(await splitmatic.isParticipant(accountNick(2))));

		await splitmatic.addParticipants([accountNick(0), accountNick(1)], [accounts[0].address, accounts[1].address]);

		expect(await splitmatic.isParticipant(deployerNick));
		expect(await splitmatic.isParticipant(accountNick(0)));
		expect(await splitmatic.isParticipant(accountNick(1)));
		expect(!(await splitmatic.isParticipant(accountNick(2))));
	});

	it('requires both nickname and address', async function () {
		await expect(splitmatic.addParticipants([accountNick(0), accountNick(1)], [accounts[0].address])).to.be.revertedWith('Array lengths do not match!');
	});

	it('can get nicknames', async function () {
		await splitmatic.addParticipants([accountNick(0), accountNick(1)], [accounts[0].address, accounts[1].address]);

		const gotNicknames = await splitmatic.getAllNicknames();
		expect(gotNicknames).to.eql([deployerNick, accountNick(0), accountNick(1)]);
		expect(gotNicknames.map(utils.parseBytes32String)).to.eql(['deployer', 'account0', 'account1']);
	});
});
