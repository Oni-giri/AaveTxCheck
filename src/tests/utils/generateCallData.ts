import { ethers } from "ethers";
import Web3 from "web3";

const functions: { [key: string]: any } = {
  supply: {
    name: "supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
    params: ["address", "uint256", "address", "uint16"],
  },
  depositETH: {
    name: "depositETH(address pool, address onBehalfOf, uint16 referralCode)",
    params: ["address", "address", "uint16"],
  },
  withdraw: {
    name: "withdraw(address asset, uint256 amount, address to)",
    params: ["address", "uint256", "address"],
  },
  withdrawETH: {
    name: "withdrawETH(address pool, uint256 amount, address to)",
    params: ["address", "uint256", "address"],
  },
};

export default function generateCallData(
  functionName: string,
  params: any[],
  abi: any
) {
  const contractInterface = new ethers.utils.Interface(abi);
  return contractInterface.encodeFunctionData(functionName, params);
}
