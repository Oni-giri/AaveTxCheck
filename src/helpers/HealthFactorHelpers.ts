import { Input } from "../types";
import { withdrawSignatures } from "./signatureHelpers";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import PoolAbi from "../abi/Pool.json";
import PriceOracleAbi from "../abi/PriceOracle.json";
import DataProviderAbi from "../abi/AaveProtocolDataProvider.json";
import { getAddressBook } from "./addressHelpers";
import * as errors from "../errors/errors";
import { BigNumber, utils, constants } from "ethers";

// TODO: add multicall to speed up the process
export default async function getHealthFactorAfterWithdraw(
  input: Input
): Promise<BigNumber> {
  const web3 = new Web3(input.chain.rpc);
  // We start by getting the user generic data
  const addressBook = getAddressBook(input.chain.id);

  // We can now analyze the data field of the transaction

  let withdrawAmount: BigNumber;
  let asset: string;

  const calldataSignature = input.tx.data.slice(0, 10);

  // We decode the transaction data to get the asset and the amount

  const calldata = web3.eth.abi.decodeParameters(
    ["address", "uint256", "address"],
    input.tx.data.slice(10)
  );
  if (calldataSignature === withdrawSignatures[0]) {
    // withdraw
    asset = calldata[0];
    withdrawAmount = BigNumber.from(calldata[1]);
  } else if (calldataSignature === withdrawSignatures[1]) {
    // withdrawETH
    asset = await addressBook.ASSETS.WETH.UNDERLYING;
    withdrawAmount = BigNumber.from(calldata[1]);
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
    return BigNumber.from(input.boundaries.healthFactor);
  }

  const lendingPoolContract = new web3.eth.Contract(
    PoolAbi as AbiItem[],
    addressBook.POOL
  );

  // We can now recover the user account data
  const userAccountData = await lendingPoolContract.methods
    .getUserAccountData(input.boundaries.allowedActor)
    .call();

  // What is the value of the assets withdrawn?
  // We can use the Aave Protocol Data Provider to get the price of the asset
  const oracleContract = new web3.eth.Contract(
    PriceOracleAbi as AbiItem[],
    addressBook.ORACLE
  );

  const oraclePriceValue: BigNumber = BigNumber.from(
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

  const denominator = BigNumber.from(10).pow(addressBook.ASSETS.WETH.decimals);

  const withdrawBaseValue = withdrawAmount
    .mul(oraclePriceValue)
    .div(denominator);

  const totalCollateralBase = BigNumber.from(
    userAccountData["totalCollateralBase"]
  );

  const healthFactorBeforeWithdraw = calculateHealthFactor(
    BigNumber.from(userAccountData.totalDebtBase),
    totalCollateralBase,
    BigNumber.from(userAccountData.currentLiquidationThreshold)
  );

  const newCollateralBase = totalCollateralBase.sub(withdrawBaseValue);

  // We can now calculate the new health factor
  // https://docs.aave.com/developers/guides/liquidations#how-is-health-factor-calculated
  const healthFactorAfterWithdraw: BigNumber = calculateHealthFactor(
    BigNumber.from(userAccountData.totalDebtBase),
    newCollateralBase,
    BigNumber.from(userAccountData.currentLiquidationThreshold)
  );

  if (healthFactorAfterWithdraw.gt(userAccountData.healthFactor)) {
    throw new errors.InvalidHealthFactorError(
      healthFactorAfterWithdraw.toString()
    );
  }

  return healthFactorAfterWithdraw;
}

function calculateHealthFactor(
  totalDebtInBaseCurrency: BigNumber,
  totalCollateralInBaseCurrency: BigNumber,
  avgLiquidationThreshold: BigNumber
): BigNumber {
  const WAD = BigNumber.from("10").pow(18);
  const PERCENTAGE_FACTOR = BigNumber.from("10").pow(4); // Assuming 4 decimal places for percentage
  const HALF_PERCENTAGE_FACTOR = PERCENTAGE_FACTOR.div(2);

  function wadDiv(a: BigNumber, b: BigNumber): BigNumber {
    return a.mul(WAD).add(b.div(2)).div(b);
  }

  function percentMul(value: BigNumber, percentage: BigNumber): BigNumber {
    if (
      percentage.isZero() ||
      value.lte(
        BigNumber.from("2").pow(256).sub(HALF_PERCENTAGE_FACTOR).div(percentage)
      )
    ) {
      return value
        .mul(percentage)
        .add(HALF_PERCENTAGE_FACTOR)
        .div(PERCENTAGE_FACTOR);
    } else {
      throw new Error("Overflow in percentMul");
    }
  }

  if (totalDebtInBaseCurrency.isZero()) {
    return BigNumber.from("2").pow(256).sub(1); // Equivalent to Solidity's type(uint256).max
  }

  return wadDiv(
    percentMul(totalCollateralInBaseCurrency, avgLiquidationThreshold),
    totalDebtInBaseCurrency
  );
}
