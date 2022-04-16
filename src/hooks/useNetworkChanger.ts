import { ethers } from "ethers";
import { FANTOM_CHAIN_PARAMS_ADD, FANTOM_CHAIN_PARAMS } from "../constants";
export function useNetworkChanger(
  provider: ethers.providers.Web3Provider | null
) {
  const addFantomOperaChain = async () => {
    try {
      if (provider)
        await provider.send("wallet_addEthereumChain", [
          FANTOM_CHAIN_PARAMS_ADD,
        ]);
    } catch (addError: any) {
      console.warn("error adding fantom chain", addError);
      if (addError?.message === "JSON RPC response format is invalid")
        window.location.reload();
    }
  };

  // Switch to Fantom chain and add fantom chain if not present already.
  const switchToFantomOperaChain = async () => {
    try {
      if (provider)
        await provider.send("wallet_switchEthereumChain", [
          { chainId: FANTOM_CHAIN_PARAMS.chainId },
        ]);
      window.location.reload();
    } catch (switchError: any) {
      // This error code indicates that the fantom chain has not been added to MetaMask.
      console.warn("error switching to fantom chain", switchError);
      if (switchError?.message === "JSON RPC response format is invalid")
        window.location.reload();
      if (switchError?.code === 4902) {
        await addFantomOperaChain();
      }
    }
  };
  return switchToFantomOperaChain;
}
