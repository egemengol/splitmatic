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
		splitmatic = await splitmaticFactory.deploy(ethers.constants.AddressZero, [deployer.address], [deployerNick]);
	});

	it('contract should have one participant', async function () {
		expect(await splitmatic.isParticipant(deployer.address));
		expect(!(await splitmatic.isParticipant(accounts[0].address)));
	});

	it('can add participants later', async function () {
		expect(await splitmatic.isParticipant(deployer.address));
		expect(!(await splitmatic.isParticipant(accounts[0].address)));
		expect(!(await splitmatic.isParticipant(accounts[1].address)));
		expect(!(await splitmatic.isParticipant(accounts[2].address)));

		await splitmatic.addParticipants([accounts[0].address, accounts[1].address], [accountNick(0), accountNick(1)]);

		expect(await splitmatic.isParticipant(deployer.address));
		expect(await splitmatic.isParticipant(accounts[0].address));
		expect(await splitmatic.isParticipant(accounts[1].address));
		expect(!(await splitmatic.isParticipant(accounts[2].address)));
	});

	it('requires both nickname and address', async function () {
		await expect(splitmatic.addParticipants([accounts[0].address], [accountNick(0), accountNick(1)])).to.be.revertedWith('Array lengths do not match!');
	});

	// it('can get nicknames', async function () {
	// 	await splitmatic.addParticipants([accounts[0].address, accounts[1].address], [accountNick(0), accountNick(1)]);

	// 	const gotNicknames = await splitmatic.getAllNicknames();
	// 	expect(gotNicknames).to.eql([deployerNick, accountNick(0), accountNick(1)]);
	// 	expect(gotNicknames.map(utils.parseBytes32String)).to.eql(['deployer', 'account0', 'account1']);
	// });
});
