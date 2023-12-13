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
import * as helpers from "../helpers";

import * as errors from "../errors/errors";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("validate.chainId", () => {
  let safe: Contract; // Declare the 'safe' variable

  beforeEach(async () => {
    safe = await fxt.deploySafeMock(ethers!); // Assign a value to 'safe'
    await fxt.approveAavePool(safe);
  });
  
  describe("Valid inputs", () => {
    it("should allow the chain id 1", async () => {
      const addresses = getAddressBook(1);
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

    it("should allow other valid chain ids", async () => {
      const keys = Object.keys(helpers.chainIdToAddressBook);
      for (const index in keys) {
        const addresses = getAddressBook(Number(keys[index]));
        const input: Input = {
          chain: {
            id: Number(keys[index]),
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
      }
    });
  });

  describe("Invalid inputs", () => {
    it("Should throw an error if the chain id is not valid", async () => {
      const input: Input = {
        chain: {
          id: 2,
          rpc: "https://localhost:8545",
        },
        tx: {
          data: generateCallData(
            "depositETH",
            [safe.address, safe.address, ethers.constants.Zero],
            WETHGatewayABI
          ),
          to: safe.address,
          value: BigNumber.from(ethers.utils.parseEther("1")).toString(),
        },
        boundaries: {
          allowedActor: safe.address,
          healthFactor: 0,
        },
      };

      await expect(validate(input)).to.be.rejectedWith(
        errors.InvalidChainIdError
      );
    });
  });
});
