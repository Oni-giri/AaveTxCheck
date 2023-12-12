import * as pools from "@bgd-labs/aave-address-book";
import { Input } from "./types";

const chainIdToAddressBook: { [chainId: number]: any } = {
  1: pools.AaveV3Ethereum,
  42161: pools.AaveV3Arbitrum,
  43114: pools.AaveV3Avalanche,
  137: pools.AaveV3Polygon,
  10: pools.AaveV3Optimism,
  100: pools.AaveV3Gnosis,
  8453: pools.AaveV3Base,
  1666600000: pools.AaveV3Harmony,
  1088: pools.AaveV3Metis,
  250: pools.AaveV3Fantom,
};

export function getAddressBook(chainId: number): any {
  return chainIdToAddressBook[chainId];
}

export function validatePoolAddress(input: Input) {
  const addressBook: any = chainIdToAddressBook[input.chain.id];
  if (!addressBook) {
    throw new Error("Invalid chain id: " + input.chain.id);
  }

  if (
    input.tx.to !== addressBook.POOL &&
    input.tx.to !== addressBook.WETH_GATEWAY
  ) {
    throw new Error(
      `Invalid target address: ${input.tx.to} \n 
            Expected: \n
            \t Pool: ${addressBook.POOL}
            \t Weth gateway: ${addressBook.WETH_GATEWAY}`
    );
  }
}
