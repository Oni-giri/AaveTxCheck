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

import * as errors from "../errors/errors";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("validate.target", () => {
  let safe: Contract; // Declare the 'safe' variable
  const addresses = getAddressBook(1);

  beforeEach(async () => {
    safe = await fxt.deploySafeMock(ethers!); // Assign a value to 'safe'
    await fxt.approveAavePool(safe);
  });

  describe("Valid inputs", () => {
    it("should allow the WETHGateway address as target", async () => {
      const input: Input = {
        chain: {
          id: 1,
          rpc: "https://localhost:8545",
        },
        tx: {
          data: generateCallData(
            "depositETH",
            [addresses.POOL, safe.address, ethers.constants.Zero],
            WETHGatewayABI
          ),
          to: addresses.WETH_GATEWAY,
          value: BigNumber.from(ethers.utils.parseEther("1")).toString(),
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

    it("should allow the Pool address as target", async () => {
      const wethContract: Contract = await fxt.getWETH(
        ethers,
        safe.address,
        ethers.utils.parseEther("1")
      );

      const input: Input = {
        chain: {
          id: 1,
          rpc: "https://localhost:8545",
        },
        tx: {
          data: generateCallData(
            "supply",
            [
              wethContract.address,
              ethers.utils.parseEther("1"),
              safe.address,
              ethers.constants.Zero,
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
      // We transfer some WETH to the safe
      await wethContract.transfer(safe.address, ethers.utils.parseEther("1"));
      // We execute the transaction
      await await safe.executeCall(input.tx.to, input.tx.data);
      const balanceAfter = await safe.getATokenBalance(
        addresses.ASSETS.WETH.A_TOKEN
      );
      expect(balanceAfter.sub(balanceBefore).gt(ethers.constants.Zero)).to.be
        .true;
    });

    describe("Invalid inputs", () => {
      it("should not allow a random address as target", async () => {
        const input: Input = {
          chain: {
            id: 1,
            rpc: "https://localhost:8545",
          },
          tx: {
            data: generateCallData(
              "depositETH",
              [addresses.POOL, safe.address, ethers.constants.Zero],
              WETHGatewayABI
            ),
            // We use the WETH token address as the "wrong" target address
            to: addresses.ASSETS.WETH.A_TOKEN,
            value: BigNumber.from(ethers.utils.parseEther("1")).toString(),
          },
          boundaries: {
            allowedActor: safe.address,
            healthFactor: 0,
          },
        };

        await expect(validate(input)).to.be.rejectedWith(
          errors.InvalidTargetAddressError
        );
      });
    });
  });
});
