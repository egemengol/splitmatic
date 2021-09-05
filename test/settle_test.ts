import { ethers } from 'hardhat';
const { BigNumber } = ethers;
const { Zero } = ethers.constants;
import { expect } from 'chai';
import { Splitmatic, ERC20Usdt } from '../typechain';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { utils } from 'ethers';

describe('Settling', function () {
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

	it("multiple expenditures", async () => {
		await splitmatic.connect(B).spend(
			recipient.address, [BigNumber.from(10), BigNumber.from(20), BigNumber.from(30)]
		);
		await splitmatic.connect(C).spend(
			recipient.address, [BigNumber.from(0), BigNumber.from(20), BigNumber.from(20)]
		);

        // Token balances
        // Contract: 0
        // A: 1000
        // B: 1000-60
        // C: 1000-40
        expect(await token.balanceOf(A.address)).to.equal(BigNumber.from(1000));
		expect(await token.balanceOf(B.address)).to.equal(BigNumber.from(1000 - 60));
		expect(await token.balanceOf(C.address)).to.equal(BigNumber.from(1000 - 40));

        // Splitmatic balances
        // A: owed=0, debt=10
        // B: owed=60, debt=40
        // C: owed=40, debt=50
		expect(await splitmatic.balanceOf(A.address)).to.eql([Zero, BigNumber.from(10)]);
		expect(await splitmatic.balanceOf(B.address)).to.eql([BigNumber.from(60), BigNumber.from(40)]);
		expect(await splitmatic.balanceOf(C.address)).to.eql([BigNumber.from(40), BigNumber.from(50)]);

        //// B settles
        await splitmatic.connect(B).settle();

        // Token balances
        // Contract: 0
        // A: 1000
        // B: 1000-60
        // C: 1000-40
        expect(await token.balanceOf(splitmatic.address)).to.equal(Zero)
        expect(await token.balanceOf(A.address)).to.equal(BigNumber.from(1000));
		expect(await token.balanceOf(B.address)).to.equal(BigNumber.from(1000 - 60));
		expect(await token.balanceOf(C.address)).to.equal(BigNumber.from(1000 - 40));

        // Splitmatic balances
        // A: owed=0, debt=10
        // B: owed=20, debt=0
        // C: owed=40, debt=50
		expect(await splitmatic.balanceOf(A.address)).to.eql([Zero, BigNumber.from(10)]);
		expect(await splitmatic.balanceOf(B.address)).to.eql([BigNumber.from(20), Zero]);
		expect(await splitmatic.balanceOf(C.address)).to.eql([BigNumber.from(40), BigNumber.from(50)]);

        //// A settles
        await splitmatic.connect(A).settle();

        // Token balances
        // Contract: 10
        // A: 1000-10
        // B: 1000-60
        // C: 1000-40
        expect(await token.balanceOf(splitmatic.address)).to.equal(BigNumber.from(10))
        expect(await token.balanceOf(A.address)).to.equal(BigNumber.from(1000 - 10));
		expect(await token.balanceOf(B.address)).to.equal(BigNumber.from(1000 - 60));
		expect(await token.balanceOf(C.address)).to.equal(BigNumber.from(1000 - 40));

        // Splitmatic balances
        // A: owed=0, debt=0
        // B: owed=20, debt=0
        // C: owed=40, debt=50
		expect(await splitmatic.balanceOf(A.address)).to.eql([Zero, Zero]);
		expect(await splitmatic.balanceOf(B.address)).to.eql([BigNumber.from(20), Zero]);
		expect(await splitmatic.balanceOf(C.address)).to.eql([BigNumber.from(40), BigNumber.from(50)]);

        //// C settles
        await splitmatic.connect(C).settle();

        // Token balances
        // Contract: 20
        // A: 1000-10
        // B: 1000-60
        // C: 1000-50
        expect(await token.balanceOf(splitmatic.address)).to.equal(BigNumber.from(20))
        expect(await token.balanceOf(A.address)).to.equal(BigNumber.from(1000 - 10));
		expect(await token.balanceOf(B.address)).to.equal(BigNumber.from(1000 - 60));
		expect(await token.balanceOf(C.address)).to.equal(BigNumber.from(1000 - 50));

        // Splitmatic balances
        // A: owed=0, debt=0
        // B: owed=20, debt=0
        // C: owed=0, debt=0
		expect(await splitmatic.balanceOf(A.address)).to.eql([Zero, Zero]);
		expect(await splitmatic.balanceOf(B.address)).to.eql([BigNumber.from(20), Zero]);
		expect(await splitmatic.balanceOf(C.address)).to.eql([Zero, Zero]);

        // B settles
        await splitmatic.connect(B).settle();

        // Token balances
        // Contract: 0
        // A: 1000-10
        // B: 1000-60+20
        // C: 1000-40
        expect(await token.balanceOf(splitmatic.address)).to.equal(Zero)
        expect(await token.balanceOf(A.address)).to.equal(BigNumber.from(1000 - 10));
		expect(await token.balanceOf(B.address)).to.equal(BigNumber.from(1000 - 60 + 20));
		expect(await token.balanceOf(C.address)).to.equal(BigNumber.from(1000 - 50));

        // Splitmatic balances
        // A: owed=0, debt=0
        // B: owed=0, debt=0
        // C: owed=0, debt=0
		expect(await splitmatic.balanceOf(A.address)).to.eql([Zero, Zero]);
		expect(await splitmatic.balanceOf(B.address)).to.eql([Zero, Zero]);
		expect(await splitmatic.balanceOf(C.address)).to.eql([Zero, Zero]);
	});
});
