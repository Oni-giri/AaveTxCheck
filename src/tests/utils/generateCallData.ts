import { ethers } from "ethers";
import Web3 from "web3";

const functions: { [key: string]: any } = {
  supply: {
    name: "supply(address asset, uint256 amount, address onBehalfOf, uint16 referralCode)",
    params: ["address", "uint256", "address", "uint16"],
  },
  depositETH: {
    name: "depositETH(address pool, address onBehalfOf, uint16 referralCode)",
    params: ["address", "address", "uint16"],
  },
  withdraw: {
    name: "withdraw(address asset, uint256 amount, address to)",
    params: ["address", "uint256", "address"],
  },
  withdrawETH: {
    name: "withdrawETH(address pool, uint256 amount, address to)",
    params: ["address", "uint256", "address"],
  },
};

export default function generateCallData(
  functionName: string,
  params: any[],
  abi: any
) {
  const contractInterface = new ethers.utils.Interface(abi);
  const web3 = new Web3();
  //   console.log(
  //     "sig1",
  //     web3.eth.abi.encodeFunctionSignature(
  //       "depositETH(address pool, address onBehalfOf, uint16 referralCode)"
  //     )
  //   );
  //   console.log(
  //     "sig2",
  //     contractInterface.encodeFunctionData("depositETH", params)
  //   );
    // TODO: replace the sigs with the nameless versions
    console.log(
      "sig3",
      web3.utils.sha3("depositETH(address,address,uint16)")
    );
    const fragment = ethers.utils.FunctionFragment.from(
      "depositETH(address pool, address onBehalfOf, uint16 referralCode)"
    );
    const iface = new ethers.utils.Interface([fragment]);
    const selector = iface.getSighash(fragment);
    console.log("Selector:", selector);
  //   console.log("function name: ", functionName, "params: ", params);
  console.log(contractInterface.fragments[3].name);
  //   console.log(contractInterface.encodeFunctionData("depositETH", params));
  return contractInterface.encodeFunctionData(functionName, params);
}
