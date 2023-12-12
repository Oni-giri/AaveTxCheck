import { Contract, Signer } from "ethers";
import { getAddressBook } from "../../helpers/addressHelpers";
import { tokenAddressBook } from "./tokenAddressBook";
import WETHGatewayABI from "../../abi/WETHGateway.json";
import PoolABI from "../../abi/Pool.json";
import ethers from "ethers";

export async function deploySafeMock(ethers: any): Promise<Contract> {
  const SafeMock = await ethers.getContractFactory("SafeMock");
  const safeMock = await SafeMock.deploy();
  await safeMock.deployed();
  return safeMock;
}

export async function approveAavePool(safeMock: Contract): Promise<void> {
  const addresses = getAddressBook(1);
  const tokens: any[] = Object.values(tokenAddressBook.ethereum);

  for (const tokenAddress of tokens) {
    await safeMock.approveToken(tokenAddress, addresses.POOL);
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

  console.log("amount", amount.toString());
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

export async function borrowTokenFromPool(
  signer: Signer,
  safeMock: Contract,
  tokenAddress: string,
  amount: ethers.BigNumber
): Promise<void> {
  const addresses = getAddressBook(1);
  const contractInterface = new ethers.utils.Interface(PoolABI);
  const calldata = contractInterface.encodeFunctionData("borrow", [
    tokenAddress,
    amount,
    2,
    0,
    safeMock.address,
  ]);

  await safeMock.executeCall(addresses.POOL, calldata);
}
