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
		splitmatic = await splitmaticFactory.deploy([A.address], [nick(A)]);
		await splitmatic.addParticipants([B.address, C.address], [nick(B), nick(C)]);
	});

	it('check starting state', async () => {
		expect(await splitmatic.isParticipant(A.address)).to.be.true;
		expect(await splitmatic.isParticipant(B.address)).to.be.true;
		expect(await splitmatic.isParticipant(C.address)).to.be.true;
		expect(await splitmatic.isParticipant(D.address)).to.be.false;

		expect(await splitmatic.getBalance(A.address)).to.equal(0);
		expect(await splitmatic.getBalance(B.address)).to.equal(0);
		expect(await splitmatic.getBalance(C.address)).to.equal(0);
		expect(await splitmatic.getBalance(D.address)).to.equal(0);
	});
});
