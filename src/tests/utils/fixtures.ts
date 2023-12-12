import { Contract, Signer } from "ethers";
import { getAddressBook } from "../../addressUtils";
import { tokenAddressBook } from "./tokenAddressBook";
import { ethers } from "ethers";
import WETHGatewayABI from "../../abi/WETHGateway.json";
import PoolABI from "../../abi/Pool.json";

export async function deploySafeMock(ethers: any): Promise<Contract> {
  const SafeMock = await ethers.getContractFactory("SafeMock");
  const safeMock = await SafeMock.deploy();
  await safeMock.deployed();
  return safeMock;
}

export async function approveAavePool(
  signer: Signer,
  safeMock: Contract
): Promise<void> {
  const addresses = getAddressBook(1);

  for (const tokenAddress of Object.values(tokenAddressBook)) {
    await safeMock.approve(addresses.POOL, tokenAddress);
  }
}

export async function supplyETHToPool(
  signer: Signer,
  safeMock: Contract,
  amount: number,
  ethers: any
): Promise<void> {
  const addresses = getAddressBook(1);
  const contractInterface = new ethers.utils.Interface(WETHGatewayABI);
  const calldata = contractInterface.encodeFunctionData("depositETH", [
    addresses.POOL,
    safeMock.address,
    0,
  ]);

  await safeMock.executeCallWithValue(addresses.WETH_GATEWAY, calldata, {
    value: ethers.utils.parseEther(amount.toString()),
  });
}

export async function supplyTokenToPool(
  signer: Signer,
  safeMock: Contract,
  tokenAddress: string,
  amount: number
): Promise<void> {
  const addresses = getAddressBook(1);
  const contractInterface = new ethers.utils.Interface(PoolABI);
  const calldata = contractInterface.encodeFunctionData("supply", [
    tokenAddress,
    safeMock.address,
    0,
  ]);

  await safeMock.executeCall(addresses.POOL, calldata);
}
