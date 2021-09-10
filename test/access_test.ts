import { ethers } from 'hardhat';
const { BigNumber } = ethers;
const { Zero } = ethers.constants;
import { expect } from 'chai';
import { Splitmatic, ERC20Usdt } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { utils } from 'ethers';

describe('Access', function () {
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

		await splitmatic.addParticipants([B.address], [nick(B)]);

		await token.connect(A).approve(splitmatic.address, 100);
		await token.connect(B).approve(splitmatic.address, 100);
		await token.connect(C).approve(splitmatic.address, 100);
		await token.connect(D).approve(splitmatic.address, 100);
	});

	it("can only add participant if participant", async () => {
		await expect(splitmatic.connect(D).addParticipants([C.address], [nick(C)])).to.be.revertedWith('Only participants can perform this action');
        expect(await splitmatic.isParticipant(C.address)).to.be.false;

		await splitmatic.connect(B).addParticipants([C.address], [nick(C)]);
        expect(await splitmatic.isParticipant(C.address)).to.be.true;
	});

    it("can only spend if participant", async () => {
		await expect(splitmatic.connect(D).spend(recipient.address, [BigNumber.from(100), BigNumber.from(100)])).to.be.revertedWith('Only participants can perform this action');
        expect(await token.balanceOf(D.address)).to.equal(BigNumber.from(1000));
		expect(await splitmatic.balanceOf(A.address)).to.eql([Zero, Zero]);

		await splitmatic.connect(B).spend(
			recipient.address, [BigNumber.from(10), BigNumber.from(20)]
		);
		expect(await token.balanceOf(B.address)).to.equal(BigNumber.from(1000 - 30));
		expect(await splitmatic.balanceOf(B.address)).to.eql([BigNumber.from(30), BigNumber.from(20)]);
	});

    it("can only settle if participant", async () => {
		await expect(splitmatic.connect(D).settle()).to.be.revertedWith('Only participants can perform this action');

		await splitmatic.connect(B).spend(
			recipient.address, [BigNumber.from(10), BigNumber.from(20)]
		);
		expect(await token.balanceOf(B.address)).to.equal(BigNumber.from(1000 - 30));
		expect(await splitmatic.balanceOf(B.address)).to.eql([BigNumber.from(30), BigNumber.from(20)], "splitmatic balance");

        console.log("token balance A: ", await token.balanceOf(A.address));
        console.log("splitmatic balance A: ", await splitmatic.balanceOf(A.address));

        await splitmatic.connect(A).settle();
        await splitmatic.connect(B).settle();        
        expect(await token.balanceOf(B.address)).to.equal(BigNumber.from(1000 - 30 + 10), "token balance");
		expect(await splitmatic.balanceOf(B.address)).to.eql([Zero, Zero], "splitmatic balance");
	});

});
