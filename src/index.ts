import { Input } from "./types";
import {
  isAllowedSignature,
  allowedFunctionSignatures,
  withdrawSignatures,
  isAllowedActor,
} from "./utils";
import { validatePoolAddress } from "./addressUtils";
import getHealthFactorAfterWithdraw from "./healthFactorAfterWithdraw";
import BigNumber from "bignumber.js";

async function validate(input: Input) {
  // We start by validating the pool address
  validatePoolAddress(input);

  // We can now analyse the data field of the transaction
  // Validating the signature
  if (!isAllowedSignature(input.tx.data)) {
    throw new Error(
      `Invalid calldata: ${input.tx.data.slice(0, 10)} \n
        Expected: \n
        \t Allowed function signatures: ${allowedFunctionSignatures}`
    );
  }

  if (!isAllowedActor(input.boundaries.allowedActor, input.tx.data)) {
    throw new Error(
      `Invalid actor \n
        Expected: \n
        \t Allowed actor: ${input.boundaries.allowedActor}`
    );
  }

  // We can now check the health factor of the user after the withdraw, if there is one
  if (withdrawSignatures.includes(input.tx.data.slice(0, 10))) {
    const newHealthFactor = await getHealthFactorAfterWithdraw(input);
    const maxHealthFactor = new BigNumber(input.boundaries.healthFactor);
    if (newHealthFactor.isLessThan(input.boundaries.healthFactor)) {
      throw new Error(
        `Health factor too low: ${newHealthFactor.toFixed()} \n
        Expected: \n
        \t Health factor above ${input.boundaries.healthFactor}`
      );
    }
  }
}

module.exports = validate;
