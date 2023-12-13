import { Input } from "../types";
import { withdrawSignatures } from "./signatureHelpers";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import PoolAbi from "../abi/Pool.json";
import PriceOracleAbi from "../abi/PriceOracle.json";
import DataProviderAbi from "../abi/AaveProtocolDataProvider.json";
import { getAddressBook } from "./addressHelpers";
import BigNumber from "bignumber.js";
import * as errors from "../errors/errors";

// TODO: add multicall to speed up the process
export default async function getHealthFactorAfterWithdraw(
  input: Input
): Promise<BigNumber> {
  const web3 = new Web3(input.chain.rpc);
  // We start by getting the user generic data
  const addressBook = getAddressBook(input.chain.id);

  // We can now analyze the data field of the transaction

  let withdrawAmount: number;
  let asset: string;

  const calldataSignature = input.tx.data.slice(0, 10);

  // We decode the transaction data to get the asset and the amount
  if (calldataSignature === withdrawSignatures[1]) {
    // withdraw ETH
    const calldata = web3.eth.abi.decodeParameters(
      ["address", "uint256", "address", "uint16"],
      input.tx.data.slice(10)
    );
    asset = calldata[0];
    withdrawAmount = calldata[1];
  } else if (calldataSignature === withdrawSignatures[0]) {
    // withdraw
    const calldata = web3.eth.abi.decodeParameters(
      ["address", "uint256", "address"],
      input.tx.data.slice(10)
    );

    asset = await addressBook.ASSETS.WETH.UNDERLYING;
    withdrawAmount = calldata[1];
  } else {
    throw new Error("Invalid calldata: " + input.tx.data.slice(0, 10));
  }

  const dataProviderContract = new web3.eth.Contract(
    DataProviderAbi as AbiItem[],
    addressBook.AAVE_PROTOCOL_DATA_PROVIDER
  );

  const userReserveData = await dataProviderContract.methods
    .getUserReserveData(asset, input.boundaries.allowedActor)
    .call();

  const usageAsCollateralEnable: boolean =
    userReserveData["usageAsCollateralEnable"];

  // If the withdrawn asset isn't used as collateral, it can't affect the health factor
  if (usageAsCollateralEnable == false) {
    return new BigNumber(input.boundaries.healthFactor);
  }

  const lendingPoolContract = new web3.eth.Contract(
    PoolAbi as AbiItem[],
    addressBook.POOL
  );


  // We can now recover the user account data
  const userAccountData = await lendingPoolContract.methods
    .getUserAccountData("0x7954f14c81b175B1914d1eaA237E3b9349AAa5dB")
    .call();

  console.log(input.boundaries.allowedActor);
  console.log("User account data ", userAccountData);
  // What is the value of the assets withdrawn?
  // We can use the Aave Protocol Data Provider to get the price of the asset
  const oracleContract = new web3.eth.Contract(
    PriceOracleAbi as AbiItem[],
    addressBook.ORACLE
  );

  const oraclePriceValue: BigNumber = new BigNumber(
    await oracleContract.methods
      .getAssetPrice(asset)
      .call()
      .then((response: any) => {
        return response;
      })
  );

  const baseCurrencyUnit = await oracleContract.methods
    .BASE_CURRENCY_UNIT()
    .call();

  const assetBaseValue = oraclePriceValue
    .multipliedBy(withdrawAmount)
    .dividedBy(addressBook.ASSETS.WETH.decimals)
    .multipliedBy(1 / baseCurrencyUnit); // Fix: Convert division to multiplication

  console.log("Withdraw amount ", withdrawAmount);
  console.log("Oracle price value ", oraclePriceValue.toFixed());
  console.log("Asset Base value ", assetBaseValue.toString());
  console.log("Base currency unit ", baseCurrencyUnit);
  console.log("Withdraw amount ", withdrawAmount);
  console.log(
    "total collateral base ",
    new BigNumber(userAccountData["totalCollateralBase"]).toString()
  );
  const totalCollateralBase = new BigNumber(
    userAccountData["totalCollateralBase"]
  );
  const newCollateralBase = totalCollateralBase.minus(assetBaseValue);
  console.log("New collateral base ", newCollateralBase.toString());

  // We can now calculate the new health factor
  // https://docs.aave.com/developers/guides/liquidations#how-is-health-factor-calculated
  const newHealthFactor: BigNumber = new BigNumber(
    (newCollateralBase * userAccountData.currentLiquidationThreshold) /
      userAccountData.totalDebtBase
  );

  if (newHealthFactor.gt(userAccountData.healthFactor)) {
    throw new errors.InvalidHealthFactorError(newHealthFactor.toString());
  }

  console.log("New health factor ", newHealthFactor.toString());
  return newHealthFactor;
}
