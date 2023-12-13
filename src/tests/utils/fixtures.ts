import { Contract, Signer } from "ethers";
import { getAddressBook } from "../../helpers/addressHelpers";
import { tokenAddressBook } from "./tokenAddressBook";
import WETHGatewayABI from "../../abi/WETHGateway.json";
import PoolABI from "../../abi/Pool.json";
import ethers from "ethers";
import { BigNumber } from "ethers";

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
  await safeMock.approveToken(
    addresses.ASSETS.WETH.UNDERLYING,
    addresses.WETH_GATEWAY
  );
  await safeMock.approveToken(
    addresses.ASSETS.WETH.A_TOKEN,
    addresses.WETH_GATEWAY
  );
}

export async function supplyETHToPool(
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
  safeMock: Contract,
  tokenAddress: string,
  amount: number
): Promise<void> {
  const addresses = getAddressBook(1);
  const contractInterface = new ethers.utils.Interface(PoolABI);
  const calldata = contractInterface.encodeFunctionData("supply", [
    tokenAddress,
    amount,
    safeMock.address,
    0,
  ]);

  await safeMock.executeCall(addresses.POOL, calldata);
}

export async function borrowTokenFromPool(
  safeMock: Contract,
  tokenAddress: string,
  amount: BigNumber
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

export async function getWETH(
  ethers: any,
  safeAddress: string,
  amount: BigNumber
): Promise<Contract> {
  const wethAddress: string = tokenAddressBook.ethereum.WETH;
  const weth: Contract = await ethers.getContractAt("IWETH9", wethAddress);
  await weth.deposit({ value: amount });
  await weth.approve(safeAddress, ethers.constants.MaxUint256);
  return weth;
}
