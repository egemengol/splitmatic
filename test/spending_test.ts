import { ethers } from 'hardhat';
const { BigNumber } = ethers;
const { Zero } = ethers.constants;
import { expect } from 'chai';
import { Splitmatic, ERC20Usdt } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { utils } from 'ethers';

describe('Spending', function () {
	let accounts: SignerWithAddress[];
	let A: SignerWithAddress;
	let B: SignerWithAddress;
	let C: SignerWithAddress;
	let D: SignerWithAddress;
	let recipient: SignerWithAddress;
	let nicks: Map<string, string>;
	const nick = (signer: SignerWithAddress) => nicks.get(signer.address)!;

	let splitmatic: Splitmatic;
	let token: ERC20Usdt;

	beforeEach(async function () {
		accounts = await ethers.getSigners();
		[A, B, C, D, recipient] = accounts;
		nicks = new Map([
			[A.address, utils.formatBytes32String('A')],
			[B.address, utils.formatBytes32String('B')],
			[C.address, utils.formatBytes32String('C')],
			[D.address, utils.formatBytes32String('D')],
		]);

		const tokenFactory = await ethers.getContractFactory('ERC20Usdt');
		token = await tokenFactory.deploy('USD Tether', 'USDT');
		token._mint(A.address, 1000);
		token._mint(B.address, 1000);
		token._mint(C.address, 1000);
		token._mint(D.address, 1000);

		const splitmaticFactory = await ethers.getContractFactory('Splitmatic');
		splitmatic = await splitmaticFactory.deploy(token.address, [A.address], [nick(A)]);

		await splitmatic.addParticipants([B.address, C.address], [nick(B), nick(C)]);

		await token.connect(A).approve(splitmatic.address, 100);
		await token.connect(B).approve(splitmatic.address, 100);
		await token.connect(C).approve(splitmatic.address, 100);
		await token.connect(D).approve(splitmatic.address, 100);
	});

	it('check starting state', async () => {
		expect(await splitmatic.isParticipant(A.address)).to.be.true;
		expect(await splitmatic.isParticipant(B.address)).to.be.true;
		expect(await splitmatic.isParticipant(C.address)).to.be.true;
		expect(await splitmatic.isParticipant(D.address)).to.be.false;

		expect(await splitmatic.balanceOf(A.address)).to.eql([Zero, Zero]);
		expect(await splitmatic.balanceOf(B.address)).to.eql([Zero, Zero]);
		expect(await splitmatic.balanceOf(C.address)).to.eql([Zero, Zero]);
		expect(await splitmatic.balanceOf(D.address)).to.eql([Zero, Zero]);

		expect(await token.balanceOf(A.address)).to.equal(BigNumber.from(1000));
		expect(await token.balanceOf(B.address)).to.equal(BigNumber.from(1000));
		expect(await token.balanceOf(C.address)).to.equal(BigNumber.from(1000));
		expect(await token.balanceOf(D.address)).to.equal(BigNumber.from(1000));

		expect(await token.allowance(A.address, splitmatic.address)).to.equal(100);
		expect(await token.allowance(B.address, splitmatic.address)).to.equal(100);
		expect(await token.allowance(C.address, splitmatic.address)).to.equal(100);
		expect(await token.allowance(D.address, splitmatic.address)).to.equal(100);
	});

	it('can spend approved amount', async () => {
		await splitmatic.connect(B).spend(recipient.address, [BigNumber.from(10), BigNumber.from(10), BigNumber.from(10)]);
		expect(await token.balanceOf(A.address)).to.equal(BigNumber.from(1000));
		expect(await token.balanceOf(B.address)).to.equal(BigNumber.from(1000 - 3 * 10));
		expect(await token.balanceOf(C.address)).to.equal(BigNumber.from(1000));
		expect(await token.balanceOf(D.address)).to.equal(BigNumber.from(1000));

		expect(await splitmatic.balanceOf(A.address)).to.eql([Zero, BigNumber.from(10)]);
		expect(await splitmatic.balanceOf(B.address)).to.eql([BigNumber.from(3 * 10), BigNumber.from(10)]);
		expect(await splitmatic.balanceOf(C.address)).to.eql([Zero, BigNumber.from(10)]);
		expect(await splitmatic.balanceOf(D.address)).to.eql([Zero, Zero]);
	});

	it('cannot spend over approved amount', async () => {
		await expect(splitmatic.connect(B).spend(recipient.address, [BigNumber.from(100), BigNumber.from(100), BigNumber.from(100)])).to.be.revertedWith('ERC20: transfer amount exceeds allowance');

		expect(await token.balanceOf(A.address)).to.equal(BigNumber.from(1000));
		expect(await token.balanceOf(B.address)).to.equal(BigNumber.from(1000));
		expect(await token.balanceOf(C.address)).to.equal(BigNumber.from(1000));
		expect(await token.balanceOf(D.address)).to.equal(BigNumber.from(1000));

		expect(await splitmatic.balanceOf(A.address)).to.eql([Zero, Zero]);
		expect(await splitmatic.balanceOf(B.address)).to.eql([Zero, Zero]);
		expect(await splitmatic.balanceOf(C.address)).to.eql([Zero, Zero]);
		expect(await splitmatic.balanceOf(D.address)).to.eql([Zero, Zero]);
	});

	it("multiple expenditures", async () => {
		await splitmatic.connect(B).spend(
			recipient.address, [BigNumber.from(10), BigNumber.from(20), BigNumber.from(30)]
		);
		await splitmatic.connect(C).spend(
			recipient.address, [BigNumber.from(0), BigNumber.from(20), BigNumber.from(20)]
		);
		expect(await token.balanceOf(A.address)).to.equal(BigNumber.from(1000));
		expect(await token.balanceOf(B.address)).to.equal(BigNumber.from(1000 - 60));
		expect(await token.balanceOf(C.address)).to.equal(BigNumber.from(1000 - 40));

		expect(await splitmatic.balanceOf(A.address)).to.eql([Zero, BigNumber.from(10)]);
		expect(await splitmatic.balanceOf(B.address)).to.eql([BigNumber.from(60), BigNumber.from(40)]);
		expect(await splitmatic.balanceOf(C.address)).to.eql([BigNumber.from(40), BigNumber.from(50)]);
	});

	it("can join ongoing group", async () => {
		await splitmatic.connect(B).spend(
			recipient.address, [BigNumber.from(10), BigNumber.from(20), BigNumber.from(30)]
		);

		await splitmatic.addParticipants([D.address], [nick(D)]);

		await splitmatic.connect(C).spend(
			recipient.address, [BigNumber.from(0), BigNumber.from(20), BigNumber.from(20), BigNumber.from(15)]
		);
		
		expect(await token.balanceOf(A.address)).to.equal(BigNumber.from(1000));
		expect(await token.balanceOf(B.address)).to.equal(BigNumber.from(1000 - 60));
		expect(await token.balanceOf(C.address)).to.equal(BigNumber.from(1000 - 55));
		expect(await token.balanceOf(D.address)).to.equal(BigNumber.from(1000));

		expect(await splitmatic.balanceOf(A.address)).to.eql([Zero, BigNumber.from(10)]);
		expect(await splitmatic.balanceOf(B.address)).to.eql([BigNumber.from(60), BigNumber.from(40)]);
		expect(await splitmatic.balanceOf(C.address)).to.eql([BigNumber.from(55), BigNumber.from(50)]);
		expect(await splitmatic.balanceOf(D.address)).to.eql([Zero, BigNumber.from(15)]);
	});
});
