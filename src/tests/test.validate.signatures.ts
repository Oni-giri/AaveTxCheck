import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";
import * as fxt from "./utils/fixtures";
import validate from "../index";
import { Input } from "../types";
import generateCallData from "./utils/generateCallData";
import { getAddressBook } from "../helpers";
import WETHGatewayABI from "../abi/WETHGateway.json";
import PoolABI from "../abi/Pool.json";
import * as helpers from "../helpers";

import * as errors from "../errors/errors";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("validate.signatures", () => {
  let safe: Contract; // Declare the 'safe' variable
  let weth: Contract;

  beforeEach(async () => {
    safe = await fxt.deploySafeMock(ethers!); // Assign a value to 'safe'
    await fxt.approveAavePool(safe);
    weth = await fxt.getWETH(
      ethers,
      safe.address,
      ethers.utils.parseEther("1")
    );
  });

  describe("Valid inputs", () => {
    it("Should allow the supply signature", async () => {
      const addresses = getAddressBook(1);
      const input: Input = {
        chain: {
          id: 1,
          rpc: "http://localhost:8545/",
        },
        tx: {
          data: generateCallData(
            "supply",
            [
              addresses.ASSETS.WETH.UNDERLYING,
              ethers.utils.parseEther("1").toString(),
              safe.address,
              0,
            ],
            PoolABI
          ),
          to: addresses.POOL,
          value: ethers.constants.Zero.toString(),
        },
        boundaries: {
          allowedActor: safe.address,
          healthFactor: 0,
        },
      };

      await validate(input);

      // We test the transaction to ensure it's working as expected
      const balanceBefore = await safe.getATokenBalance(
        addresses.ASSETS.WETH.A_TOKEN
      );

      weth.transfer(safe.address, ethers.utils.parseEther("1"));
      await safe.executeCall(input.tx.to, input.tx.data);
      // const balanceAfter = await safe.getATokenBalance(
      //   addresses.ASSETS.WETH.A_TOKEN
      // );
      // expect(balanceAfter.sub(balanceBefore).gt(ethers.constants.Zero)).to.be
      //   .true;
    });

    it("Should allow the depositETH signature", async () => {
      const addresses = getAddressBook(1);
      const input: Input = {
        chain: {
          id: 1,
          rpc: "http://127.0.0.1:8545/",
        },
        tx: {
          data: generateCallData(
            "depositETH",
            [addresses.POOL, safe.address, ethers.constants.Zero],
            WETHGatewayABI
          ),
          to: addresses.WETH_GATEWAY,
          value: ethers.utils.parseEther("1").toString(),
        },
        boundaries: {
          allowedActor: safe.address,
          healthFactor: 0,
        },
      };

      await validate(input);

      // We test the transaction to ensure it's working as expected
      const balanceBefore = await safe.getATokenBalance(
        addresses.ASSETS.WETH.A_TOKEN
      );
      await safe.executeCallWithValue(input.tx.to, input.tx.data, {
        value: input.tx.value,
      });
      const balanceAfter = await safe.getATokenBalance(
        addresses.ASSETS.WETH.A_TOKEN
      );
      expect(balanceAfter.sub(balanceBefore).gt(ethers.constants.Zero)).to.be
        .true;
    });

    it("Should allow the withdraw signature", async () => {
      const addresses = getAddressBook(1);
      const input: Input = {
        chain: {
          id: 1,
          rpc: "http://127.0.0.1:8545/",
        },
        tx: {
          data: generateCallData(
            "withdraw",
            [
              addresses.ASSETS.WETH.UNDERLYING,
              ethers.utils.parseEther("1"),
              safe.address,
            ],
            PoolABI
          ),
          to: addresses.POOL,
          value: ethers.constants.Zero.toString(),
        },
        boundaries: {
          allowedActor: safe.address,
          healthFactor: 0,
        },
      };

      await validate(input);

      // We test the transaction to ensure it's working as expected
      await safe.supplyToPool(
        addresses.POOL,
        addresses.ASSETS.WETH.UNDERLYING,
        ethers.utils.parseEther("1")
      );
      const balanceBefore = await safe.getATokenBalance(
        addresses.ASSETS.WETH.A_TOKEN
      );
      await safe.executeCall(input.tx.to, input.tx.data);
      const balanceAfter = await safe.getATokenBalance(
        addresses.ASSETS.WETH.A_TOKEN
      );
      expect(balanceAfter.lt(balanceBefore)).to.be.true;
    });
    it("Should allow the withdrawETH signature", async () => {
      const addresses = getAddressBook(1);
      const input: Input = {
        chain: {
          id: 1,
          rpc: "http://127.0.0.1:8545/",
        },
        tx: {
          data: generateCallData(
            "withdrawETH",
            [addresses.POOL, ethers.utils.parseEther("1"), safe.address],
            WETHGatewayABI
          ),
          to: addresses.WETH_GATEWAY,
          value: ethers.constants.Zero.toString(),
        },
        boundaries: {
          allowedActor: safe.address,
          healthFactor: 0,
        },
      };

      await validate(input);

      // // We test the transaction to ensure it's working as expected
      // await safe.supplyToPool(
      //   addresses.POOL,
      //   addresses.ASSETS.WETH.UNDERLYING,
      //   ethers.utils.parseEther("1")
      // );

      // const balanceBefore = await safe.getATokenBalance(
      //   addresses.ASSETS.WETH.A_TOKEN
      // );

      // await safe.approveToken(
      //   addresses.ASSETS.WETH.UNDERLYING,
      //   addresses.WETH_GATEWAY
      // );

      // await safe.executeCall(input.tx.to, input.tx.data);
      // const balanceAfter = await safe.getATokenBalance(
      //   addresses.ASSETS.WETH.A_TOKEN
      // );
      // expect(balanceAfter.lt(balanceBefore)).to.be.true;
    });
  });

  describe("Invalid inputs", () => {
    it("should not allow a random signature", async () => {
      const addresses = getAddressBook(1);
      const input: Input = {
        chain: {
          id: 1,
          rpc: "http://127.0.0.1:8545/",
        },
        tx: {
          data: "0x12345678",
          to: addresses.POOL,
          value: ethers.constants.Zero.toString(),
        },
        boundaries: {
          allowedActor: safe.address,
          healthFactor: 0,
        },
      };

      await expect(validate(input)).to.be.rejectedWith(
        errors.InvalidCalldataError
      );
    });
  });
});
