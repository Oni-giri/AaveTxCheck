import Web3 from "web3";
const web3 = new Web3();
import { readFileSync } from 'fs';

// From https://docs.aave.com/developers/core-contracts/pool
// https://docs.aave.com/developers/periphery-contracts/wethgateway
export const allowedFunctionNames = [
  "supply(address,uint256,address,uint16)",
  "depositETH(address,address,uint16)",
  "withdraw(address,uint256,address)",
  "withdrawETH(address,uint256,address)",
];

export const allowedFunctionSignatures = allowedFunctionNames.map((fn) =>
  web3.eth.abi.encodeFunctionSignature(fn)
);

// Function to read the ABI file and return a mapping of function names to signatures
async function generateFunctionSignatureMapping(abiFilePath: string): Promise<{ [key: string]: string }> {
  // Read the ABI file
  const abi = JSON.parse(readFileSync(abiFilePath, 'utf8'));

  // Create the mapping
  const signatureMapping = abi
      .filter((item: any) => item.type === 'function')
      .reduce((acc: { [key: string]: string }, func: any) => {
          const signature = web3.eth.abi.encodeFunctionSignature(func);
          acc[func.name] = signature;
          return acc;
      }, {});

  return signatureMapping;
}

export const supplySignatures = [
  allowedFunctionNames[0],
  allowedFunctionNames[1],
];

export const withdrawSignatures = [
  allowedFunctionNames[2],
  allowedFunctionNames[3],
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
