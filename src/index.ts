import Web3 from "web3";
import { Input } from "./types";
import * as pools from "@bgd-labs/aave-address-book";
import { AbiItem } from "web3-utils";
import {
  isAllowedSignature,
  allowedFunctionSignatures,
  withdrawSignatures,
  isAllowedActor,
} from "./utils";
import { getHealthFactorAfterWithdraw } from "./healthFactorAfterWithdraw";

async function validate(input: Input) {
  // TODO: validate RPC inputs
  const web3 = new Web3(input.chain.rpc);

  // TODO: add a reverse lookup for the different chainIds
  // Here we use eth

  // We load the lending pool address from the address book
  const lendingPool = pools.AaveV3Ethereum.POOL;
  const wethGateway = pools.AaveV3Ethereum.WETH_GATEWAY;

  if (input.tx.to !== lendingPool && input.tx.to !== wethGateway) {
    throw new Error(
      `Invalid target address: ${input.tx.to} \n 
        Expected: \n
        \t Pool: ${lendingPool} \n 
        \t Weth Gateway: ${wethGateway}`
    );
  }

  // We can now analyse the data field of the transaction
  // Validating the signature
  if (!isAllowedSignature(input.tx.data)) {
    throw new Error(
      `Invalid calldata: ${input.tx.data.slice(0, 10)} \n
        Expected: \n
        \t Allowed function signatures: ${allowedFunctionSignatures}`
    );
  }

  if (!isAllowedActor(input.boundaries.allowedActor, input.tx.data)) {
    throw new Error(
      `Invalid actor \n
        Expected: \n
        \t Allowed actor: ${input.boundaries.allowedActor}`
    );
  }

  const poolAbi: AbiItem[] = require("./abi/Pool.json");
  const wethGatewayAbi: AbiItem[] = require("./abi/WETHGateway.json");
  const poolContract = new web3.eth.Contract(poolAbi, lendingPool);

  // We can now check the health factor of the user after the withdraw, if there is one
  if (withdrawSignatures.includes(input.tx.data.slice(0, 10))) {
    const newHealthFactor = await getHealthFactorAfterWithdraw(input);
    if (newHealthFactor < input.boundaries.healthFactor) {
      throw new Error(
        `Health factor too low: ${newHealthFactor} \n
        Expected: \n
        \t Health factor above ${input.boundaries.healthFactor}`
      );
    }
  }
}
