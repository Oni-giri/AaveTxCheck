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
    it("Should allow to withdraw with required healthFactor 0", async () => {
      const input: Input = {
        chain: {
          id: 1,
          rpc: process.env.RPC_URL as string,
        },
        tx: {
          data: generateCallData(
            "withdraw",
            [
              addresses.ASSETS.WETH.UNDERLYING,
              ethers.utils.parseEther("0.1").toString(),
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

      console.log("poool ", addresses.POOL)

      const dataProviderContract = new ethers.Contract(
        addresses.AAVE_PROTOCOL_DATA_PROVIDER,
        DataProviderAbi,
        ethers.provider
      );

      const pool: Contract = await ethers.getContractAt(
        PoolABI,
        addresses.POOL
      );

      console.log(safe.address)
      const userAccountData = await pool.getUserAccountData("0x7954f14c81b175B1914d1eaA237E3b9349AAa5dB");

      console.log(userAccountData);

      // We test the validation
      await validate(input);
    });

    // it("Should allow to withdraw with required healthFactor of 2", async () => {
    //   const input: Input = {
    //     chain: {
    //       id: 1,
    //       rpc: "https://localhost:8545",
    //     },
    //     tx: {
    //       data: generateCallData(
    //         "withdraw",
    //         [addresses.ASSETS.WETH.UNDERLYING, ethers.utils.parseEther("0.1").toString(), safe.address],
    //         PoolABI
    //       ),
    //       to: addresses.POOL,
    //       value: ethers.constants.Zero.toString(),
    //     },
    //     boundaries: {
    //       allowedActor: safe.address,
    //       healthFactor: 2,
    //     },
    //   };

    //   // We try first with no debt and now assets
    //   await validate(input);

    //   // We now deposit some assets
    //   await safe.supplyToPool(
    //     addresses.POOL,
    //     addresses.ASSETS.WETH.UNDERLYING,
    //     ethers.utils.parseEther("1")
    //   );
    //   const balanceBefore = await safe.getATokenBalance(
    //     addresses.ASSETS.WETH.A_TOKEN
    //   );
    //   expect(balanceBefore.gt(ethers.constants.Zero)).to.be.true;
    //   // We retest the validation
    //   await validate(input);

    //   // We now borrow some assets
    //   await safe.setAssetAsCollateral(
    //     addresses.POOL,
    //     addresses.ASSETS.WETH.UNDERLYING
    //   );

    //   await safe.borrowFromPool(
    //     addresses.POOL,
    //     addresses.ASSETS.WETH.UNDERLYING,
    //     ethers.utils.parseEther("0.1")
    //   );

    //   const pool: Contract = await ethers.getContractAt(
    //     PoolABI,
    //     addresses.POOL
    //   );

    //   const response = await pool.getUserAccountData(safe.address);
    //   console.log(response["healthFactor"])

    // });
  });
});
