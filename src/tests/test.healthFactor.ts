import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";
import * as fxt from "./utils/fixtures";
import { validate } from "../index";
import { Input } from "../types";
import generateCallData from "./utils/generateCallData";
import { getAddressBook } from "../helpers";
import WETHGatewayABI from "../abi/WETHGateway.json";
import PoolABI from "../abi/Pool.json";
import DataProviderAbi from "../abi/AaveProtocolDataProvider.json";
import * as helpers from "../helpers";

import * as errors from "../errors/errors";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("validate.healthFactor", () => {
  let safe: Contract; // Declare the 'safe' variable
  let weth: Contract;
  const addresses = getAddressBook(1);

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
    it("Should allow to withdraw with required healthFactor of 2", async () => {
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
              ethers.utils.parseEther("0.7").toString(),
              safe.address,
            ],
            PoolABI
          ),
          to: addresses.POOL,
          value: ethers.constants.Zero.toString(),
        },
        boundaries: {
          allowedActor: safe.address,
          healthFactor: 20000,
        },
      };

      // We now deposit some assets
      await safe.supplyToPool(
        addresses.POOL,
        addresses.ASSETS.WETH.UNDERLYING,
        ethers.utils.parseEther("1")
      );
      const balanceBefore = await safe.getATokenBalance(
        addresses.ASSETS.WETH.A_TOKEN
      );
      expect(balanceBefore.gt(ethers.constants.Zero)).to.be.true;

      // We now borrow some assets
      await safe.setAssetAsCollateral(
        addresses.POOL,
        addresses.ASSETS.WETH.UNDERLYING
      );

      await safe.borrowFromPool(
        addresses.POOL,
        addresses.ASSETS.WETH.UNDERLYING,
        ethers.utils.parseEther("0.1")
      );

      // We try first with no debt and now assets
      await validate(input);
    });
  });

  describe("Invalid inputs", () => {
    it("Should fail if the health factor is too low", async () => {
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
              ethers.utils.parseEther("0.7").toString(),
              safe.address,
            ],
            PoolABI
          ),
          to: addresses.POOL,
          value: ethers.constants.Zero.toString(),
        },
        boundaries: {
          allowedActor: safe.address,
          healthFactor: 40000,
        },
      };

      // We now deposit some assets
      await safe.supplyToPool(
        addresses.POOL,
        addresses.ASSETS.WETH.UNDERLYING,
        ethers.utils.parseEther("1")
      );
      const balanceBefore = await safe.getATokenBalance(
        addresses.ASSETS.WETH.A_TOKEN
      );
      expect(balanceBefore.gt(ethers.constants.Zero)).to.be.true;

      // We now borrow some assets
      await safe.setAssetAsCollateral(
        addresses.POOL,
        addresses.ASSETS.WETH.UNDERLYING
      );

      await safe.borrowFromPool(
        addresses.POOL,
        addresses.ASSETS.WETH.UNDERLYING,
        ethers.utils.parseEther("0.1")
      );

      // We try first with no debt and now assets
      await expect(validate(input)).to.be.rejectedWith(
        errors.HealthFactorTooLowError
      );
    });
  });
});
