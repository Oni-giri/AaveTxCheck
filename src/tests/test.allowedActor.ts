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

describe("validate.allowedActor", () => {
  let safe: Contract; // Declare the 'safe' variable
  const addresses = getAddressBook(1);

  beforeEach(async () => {
    safe = await fxt.deploySafeMock(ethers!); // Assign a value to 'safe'
    await fxt.approveAavePool(safe);
  });

  describe("Valid inputs", () => {
    it("Should allow the safe address as allowedActor with supply func", async () => {
      const input: Input = {
        chain: {
          id: 1,
          rpc: "https://localhost:8545",
        },
        tx: {
          data: generateCallData(
            "supply",
            [addresses.ASSETS.WETH.UNDERLYING, 1, safe.address, 0],
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
    });

    it("Should allow another address as allowedActor with supply func", async () => {
      const input: Input = {
        chain: {
          id: 1,
          rpc: "https://localhost:8545",
        },
        tx: {
          data: generateCallData(
            "supply",
            [
              addresses.ASSETS.WETH.UNDERLYING,
              1,
              addresses.ASSETS.WETH.UNDERLYING,
              0,
            ],
            PoolABI
          ),
          to: addresses.POOL,
          value: ethers.constants.Zero.toString(),
        },
        boundaries: {
          allowedActor: addresses.ASSETS.WETH.UNDERLYING,
          healthFactor: 0,
        },
      };

      await validate(input);
    });

    it("Should allow the safe address as allowedActor with depositETH func", async () => {
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
    });

    it("Should allow another address as allowedActor with depositETH func", async () => {
      const input: Input = {
        chain: {
          id: 1,
          rpc: "https://localhost:8545",
        },
        tx: {
          data: generateCallData(
            "depositETH",
            [
              addresses.POOL,
              addresses.ASSETS.WETH.UNDERLYING,
              ethers.constants.Zero,
            ],
            WETHGatewayABI
          ),
          to: addresses.WETH_GATEWAY,
          value: BigNumber.from(ethers.utils.parseEther("1")).toString(),
        },
        boundaries: {
          allowedActor: addresses.ASSETS.WETH.UNDERLYING,
          healthFactor: 0,
        },
      };

      await validate(input);
    });
  });

  describe("Invalid inputs", () => {
    it("Should throw an error if the allowedActor is not valid with depositETH", async () => {
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
          allowedActor: addresses.ASSETS.WETH.A_TOKEN,
          healthFactor: 0,
        },
      };

      await expect(validate(input)).to.be.rejectedWith(
        errors.InvalidActorError
      );
    });

    it("Should throw an error if the allowedActor is not valid with supply", async () => {
      const input: Input = {
        chain: {
          id: 1,
          rpc: "https://localhost:8545",
        },
        tx: {
          data: generateCallData(
            "supply",
            [addresses.ASSETS.WETH.UNDERLYING, 1, safe.address, 0],
            PoolABI
          ),
          to: addresses.POOL,
          value: ethers.constants.Zero.toString(),
        },
        boundaries: {
          allowedActor: addresses.ASSETS.WETH.A_TOKEN,
          healthFactor: 0,
        },
      };

      await expect(validate(input)).to.be.rejectedWith(
        errors.InvalidActorError
      );
    });
  });
});
