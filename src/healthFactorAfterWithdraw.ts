import { Input } from "./types";
import * as pools from "@bgd-labs/aave-address-book";
import { withdrawSignatures } from "./utils";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import WETHGatewayAbi from "./abi/WETHGateway.json";


export default async function getHealthFactorAfterWithdraw(input: Input) {
  const web3 = new Web3(input.chain.rpc);
  // We start by getting the user generic data
  const lendingPool = pools.AaveV3Ethereum.POOL;
  const dataProvider = pools.AaveV3Ethereum.AAVE_PROTOCOL_DATA_PROVIDER;

  // We can now analyze the data field of the transaction

  let withdrawAmount: number;
  let asset: string;

  const calldataSignature = input.tx.data.slice(0, 10);

  // We decode the transaction data to get the asset and the amount
  if (calldataSignature === withdrawSignatures[0]) {
    // classic withdraw
    const calldata = web3.eth.abi.decodeParameters(
      ["address", "uint256", "address", "uint16"],
      input.tx.data.slice(10)
    );
    asset = calldata[0];
    withdrawAmount = calldata[1];
  } else if (calldataSignature === withdrawSignatures[1]) {
    // withdraw ETH
    const calldata = web3.eth.abi.decodeParameters(
      ["address", "address", "uint16"],
      input.tx.data.slice(10)
    );

    const wethGateway = new web3.eth.Contract(
      WETHGatewayAbi as AbiItem[],
      pools.AaveV3Ethereum.WETH_GATEWAY
    );
    asset = await wethGateway.methods.getWethAaddress();
    withdrawAmount = calldata[2];
  } else {
    throw new Error("Invalid calldata: " + input.tx.data.slice(0, 10));
  }

  const dataProviderContract = new web3.eth.Contract(
    require("./abi/AaveProtocolDataProvider.json"),
    dataProvider
  );

  const userReserveData = dataProviderContract.methods
    .getUserReserveData(asset, input.boundaries.allowedActor)
    .call()
    .then(
      (response: {
        currentATokenBalance: any;
        currentStableDebt: any;
        currentVariableDebt: any;
        principalStableDebt: any;
        scaledVariableDebt: any;
        stableBorrowRate: any;
        liquidityRate: any;
        stableRateLastUpdated: any;
        usageAsCollateralEnable: boolean;
      }) => {
        const {
          currentATokenBalance,
          currentStableDebt,
          currentVariableDebt,
          principalStableDebt,
          scaledVariableDebt,
          stableBorrowRate,
          liquidityRate,
          stableRateLastUpdated,
          usageAsCollateralEnable,
        } = response;
      }
    );

  const usageAsCollateralEnable: boolean =
    userReserveData.usageAsCollateralEnable;

  // If the withdrawn asset isn't used as collateral, it can't affect the health factor
  if (usageAsCollateralEnable == false) {
    return;
  }

  const lendingPoolContract = new web3.eth.Contract(
    require("./abi/Pool.json"),
    lendingPool
  );

  // We can now recover the user account data
  const userAccountData = lendingPoolContract.methods
    .getUserAccountData(input.boundaries.allowedActor)
    .call()
    .then(
      (response: {
        totalCollateralBase: any;
        totalDebtBase: any;
        availableBorrowsBase: any;
        currentLiquidationThreshold: any;
        ltv: any;
        healthFactor: any;
      }) => {
        const {
          totalCollateralBase,
          totalDebtBase,
          availableBorrowsBase,
          currentLiquidationThreshold,
          ltv,
          healthFactor,
        } = response;
      }
    );

  // What is the value of the assets withdrawn?
  // We can use the Aave Protocol Data Provider to get the price of the asset
  const oracleContract = new web3.eth.Contract(
    require("./abi/PriceOracle.json"),
    pools.AaveV3Ethereum.ORACLE
  );

  const oraclePriceValue = oracleContract.methods
    .getAssetPrice(asset)
    .call()
    .then((response: any) => {
      return response;
    });
  const baseAssetDecimals = oracleContract.methods
    .BASE_ASSET_DECIMALS()
    .call()
    .then((response: any) => {
      return response;
    });

  const assetBaseValue =
    (oraclePriceValue * withdrawAmount) / baseAssetDecimals;

  const newCollateralBase =
    userAccountData.totalCollateralBase - assetBaseValue;

  // We can now calculate the new health factor
  // https://docs.aave.com/developers/guides/liquidations#how-is-health-factor-calculated
  const newHealthFactor =
    (newCollateralBase * userAccountData.currentLiquidationThreshold) /
    userAccountData.totalDebtBase;

  if (newHealthFactor > userAccountData.healthFactor) {
    throw Error("Invalid health factor calculation: " + newHealthFactor);
  }

  return newHealthFactor;
}
