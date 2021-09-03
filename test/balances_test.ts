import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Splitmatic } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { utils } from 'ethers';

describe('Balance Management', function () {
	let accounts: SignerWithAddress[];
	let A: SignerWithAddress;
	let B: SignerWithAddress;
	let C: SignerWithAddress;
	let D: SignerWithAddress;
	let nicks: Map<string, string>;
	const nick = (signer: SignerWithAddress) => nicks.get(signer.address)!;

	let splitmatic: Splitmatic;

	beforeEach(async function () {
		accounts = await ethers.getSigners();
		[A, B, C, D] = accounts;
		nicks = new Map([
			[A.address, utils.formatBytes32String('A')],
			[B.address, utils.formatBytes32String('B')],
			[C.address, utils.formatBytes32String('C')],
			[D.address, utils.formatBytes32String('D')],
		]);

		const splitmaticFactory = await ethers.getContractFactory('Splitmatic');
		splitmatic = await splitmaticFactory.deploy([nick(A)], [A.address]);
		await splitmatic.addParticipants([nick(B), nick(C)], [B.address, C.address]);
	});

	it('check starting state', async () => {
		expect(await splitmatic.isParticipant(nick(A))).to.be.true;
		expect(await splitmatic.isParticipant(nick(C))).to.be.true;
		expect(await splitmatic.isParticipant(nick(B))).to.be.true;
		expect(await splitmatic.isParticipant(nick(D))).to.be.false;

		expect(await splitmatic.getBalance(nick(A))).to.equal(0);
		expect(await splitmatic.getBalance(nick(B))).to.equal(0);
		expect(await splitmatic.getBalance(nick(C))).to.equal(0);
		expect(await splitmatic.getBalance(nick(D))).to.equal(0);
	});
});
