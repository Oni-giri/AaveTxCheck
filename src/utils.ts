import { AbiItem } from "web3-utils";
const poolAbi: AbiItem[] = require("./abi/Pool.json");
const wethGatewayAbi: AbiItem[] = require("./abi/WETHGateway.json");
import Web3 from "web3";
const web3 = new Web3();

// From https://docs.aave.com/developers/core-contracts/pool
// https://docs.aave.com/developers/periphery-contracts/wethgateway
export const allowedFunctionNames = [
  "supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
  "depositETH(address pool, address onBehalfOf, uint16 referralCode)",
  "withdraw(address asset, uint256 amount, address to)",
  "withdrawETH(address pool, uint256 amount, address to)",
];

export const allowedFunctionSignatures = allowedFunctionNames.map((fn) =>
  web3.eth.abi.encodeFunctionSignature(fn)
);

export const supplySignatures = [
  "supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
  "depositETH(address pool, address onBehalfOf, uint16 referralCode)",
];

export const withdrawSignatures = [
  "withdraw(address asset, uint256 amount, address to)",
  "withdrawETH(address pool, uint256 amount, address to)",
];

// Function to check if calldata corresponds to an allowed function
export function isAllowedSignature(calldata: string) {
  const calldataSignature = calldata.slice(0, 10);
  return allowedFunctionSignatures.includes(calldataSignature);
}

export function isAllowedActor(allowedActor: string, data: string) {
  const calldataSignature = data.slice(0, 10);
  if (calldataSignature === allowedFunctionSignatures[0]) {
    const calldata = web3.eth.abi.decodeParameters(
      ["address", "uint256", "address", "uint16"],
      data.slice(10)
    );
    return calldata[2] === allowedActor;
  } else if (calldataSignature === allowedFunctionSignatures[1]) {
    const calldata = web3.eth.abi.decodeParameters(
      ["address", "address", "uint16"],
      data.slice(10)
    );
    return calldata[1] === allowedActor;
  }
  else {
    // We do a check here to avoid the case where we validate a wrong signature.
    return isAllowedSignature(data);
  }
}
