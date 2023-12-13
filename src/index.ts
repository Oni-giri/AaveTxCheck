import { Input } from "./types";
import * as helpers from "./helpers";
import * as errors from "./errors/errors";
import { BigNumber } from "ethers";

export async function validate(input: Input) {
  const addresses = helpers.getAddressBook(input.chain.id);

  // Validate the chain id
  if (!addresses) {
    throw new errors.InvalidChainIdError(input.chain.id);
  }

  // Validate the target address
  if (
    input.tx.to !== addresses.POOL &&
    input.tx.to !== addresses.WETH_GATEWAY
  ) {
    throw new errors.InvalidTargetAddressError(
      input.tx.to,
      addresses.POOL,
      addresses.WETH_GATEWAY
    );
  }

  // Analyse the data field of the transaction
  // Validating the signature
  if (!helpers.isAllowedSignature(input.tx.data)) {
    throw new errors.InvalidCalldataError(
      input.tx.data,
      helpers.allowedFunctionSignatures.join(", ")
    );
  }

  // Validating the actor
  if (!helpers.isAllowedActor(input.boundaries.allowedActor, input.tx.data)) {
    throw new errors.InvalidActorError(input.boundaries.allowedActor);
  }

  // Check the health factor after the withdraw
  if (helpers.withdrawSignatures.includes(input.tx.data.slice(0, 10))) {
    const newHealthFactor = await helpers.getHealthFactorAfterWithdraw(input);
    const maxHealthFactor = BigNumber.from(input.boundaries.healthFactor).mul(
      BigNumber.from("10").pow(18 - 4)
    );


    if (newHealthFactor.lt(maxHealthFactor)) {
      throw new errors.HealthFactorTooLowError(
        newHealthFactor.toString(),
        input.boundaries.healthFactor
      );
    }
  }
}
