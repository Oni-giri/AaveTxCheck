import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { ethers } from "hardhat";
import * as fxt from "./utils/fixtures";
import { validate } from "../index";
import { Input } from "../types";
import generateCallData from "./utils/generateCallData";
import WETHGatewayABI from "../abi/WETHGateway.json";
import { getAddressBook } from "../helpers";

describe("validate.address", () => {
  let index;

  let safe: Contract; // Declare the 'safe' variable
  const addresses = getAddressBook(1);

  beforeEach(async () => {
    safe = await fxt.deploySafeMock(ethers!); // Assign a value to 'safe'
    console.log("safe", safe.address)
    await fxt.approveAavePool(safe);
    console.log("approved")
  });

  it("should allow the input", async () => {
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
});
