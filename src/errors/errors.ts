import BigNumber from "bignumber.js";

export class InvalidChainIdError extends Error {
  chainId: number;

  constructor(chainId: number) {
    super(`Invalid chain id: ${chainId}`);
    this.name = "InvalidChainIdError";
    this.chainId = chainId;
  }
}

export class InvalidTargetAddressError extends Error {
  targetAddress: string;
  expectedPoolAddress: string;
  expectedWethGatewayAddress: string;

  constructor(
    targetAddress: string,
    poolAddress: string,
    wethGatewayAddress: string
  ) {
    super(`Invalid target address: ${targetAddress} \n 
               Expected: \n
               \t Pool: ${poolAddress}
               \t Weth gateway: ${wethGatewayAddress}`);
    this.name = "InvalidTargetAddressError";
    this.targetAddress = targetAddress;
    this.expectedPoolAddress = poolAddress;
    this.expectedWethGatewayAddress = wethGatewayAddress;
  }
}

export class InvalidCalldataError extends Error {
  calldata: string;
  allowedFunctionSignatures: string;

  constructor(calldata: string, allowedFunctionSignatures: string) {
    super(`Invalid calldata: ${calldata.slice(0, 10)} \n
               Expected: \n
               \t Allowed function signatures: ${allowedFunctionSignatures}`);
    this.name = "InvalidCalldataError";
    this.calldata = calldata;
    this.allowedFunctionSignatures = allowedFunctionSignatures;
  }
}

export class InvalidActorError extends Error {
  allowedActor: string;

  constructor(allowedActor: string) {
    super(`Invalid actor \n
               Expected: \n
               \t Allowed actor: ${allowedActor}`);
    this.name = "InvalidActorError";
    this.allowedActor = allowedActor;
  }
}

export class HealthFactorTooLowError extends Error {
  healthFactor: string;
  boundary: number;

  constructor(healthFactor: string, boundary: number) {
    super(`Health factor too low: ${healthFactor} \n
               Expected: \n
               \t Health factor above ${boundary}`);
    this.name = "HealthFactorTooLowError";
    this.healthFactor = healthFactor;
    this.boundary = boundary;
  }
}

export class InvalidHealthFactorError extends Error {
  healthFactor: string;

  constructor(healthFactor: string) {
    super(`Invalid health factor calculation: ${healthFactor}`);
    this.name = "InvalidHealthFactorError";
    this.healthFactor = healthFactor;
  }
}
