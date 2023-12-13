# AaveTxCheck

This library aims to help users of proxy contracts, such as the Safe multisig wallet, to check that the transaction data and parameters is valid and safe to sign.

The following items are checked by the library:
- Do we deposit for the desired user?
- Is the result health factor above the desired limit?
- Is the target Aave address correct given the chain id?
- Are we interacting with the right Aave contract?
- Is the function selector correct?

## Setting up
You can download the package using :
```bash
npm install aave-tx-check
```

Then, you can import the `validate(input: Input)` function in your code:
```typescript
import validate from 'aave-tx-check'
```

The input is the following:
```javascript
type Input = {
   chain: {
       id: number; rpc: string;
   },
   tx: {
       to: string; data: string; value: string;
   },
   boundaries: {
       allowedActor: string;
       healthFactor: number;
   }
}
```

- `chain.id`: the chain id of the transaction. This is used to check the Aave contrac addresses.
- `chain.rpc`: RPC url the library will use to perform checks.

- `tx.to` : the target of the transaction, e.g the Aave pool.
- `tx.data` : the calldata that will be sent by you proxy contract.
- `tx.value` : the amount of native token (e.g ETH) that you intend to include in the transaction.

- `boundaries.allowedActors` : the address on behalf of who the assets should be deposited. In case of a withdraw, you should specify whose assets should be withdrawn.
- `boundaries.healthFactor`: the minimum health factor required for the transaction to be valid. Keep in mind that a health factor of 1 will here be 10000 (=1*10^4) for scaling purposes.

If the input is problematic, the function call with throw an error.

You can test the repo with:
```bash
npm run test
```



