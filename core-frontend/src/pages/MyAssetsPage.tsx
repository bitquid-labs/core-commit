import { cn } from "lib/utils";
import React, { useState, useEffect } from "react";
import { useAccount } from 'wagmi'; 
import InvestedPools from "views/MyAssets/Pools/InvestedPools";
import VaultsOverview from "views/MyAssets/Vaults/VaultsOverview";
import metamask from "../assets/images/metamask.svg";
import btc from "../assets/images/bitcoin.svg";
import { ethers } from "ethers";
import vaultABI from '../abi/Vaults.json';
import { BrowserProvider } from 'ethers';

const MyAssetsPage = () => {
  const { address: walletAddress, isConnected: isWalletConnected } = useAccount();
  const types = ["Pools", "Strategies"];
  const [currentAsset, setCurretAsset] = useState(0);
  const [walletBalance, setWalletBalance] = useState("");

  interface VaultDeposit {
    amount: bigint;
    vaultId: number;
  }

  interface Pool {
    poolName: string;
    depositAmount: bigint;
  }

  const [pools, setPools] = useState<Pool[]>([]);
  const [vaultNames, setVaultNames] = useState<string[]>([]);

  useEffect(() => {
    console.log("Wallet Connection Status:", isWalletConnected);
    console.log("Wallet Address:", walletAddress);

    const fetchWalletDetails = async () => {
      if (!isWalletConnected || !walletAddress) {
        setPools([]);
        setVaultNames([]);
        setWalletBalance("");
        return;
      }

      try {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        // Fetch pools
        const poolContractAddress = "0xFc226a099aE3068C3A7C7389bcFa0d7FfDa37C0e";
        const poolAbi = [
          "function getPoolsByAddress(address _userAddress) public view returns (tuple(string poolName, uint256 depositAmount)[])"
        ];
        const poolContract = new ethers.Contract(poolContractAddress, poolAbi, provider);
        const userPools = await poolContract.getPoolsByAddress(walletAddress);
        setPools(userPools);

        // Fetch wallet balance
        const balanceAbi = [
          "function getUserBalanceinUSD(address user) public view returns(uint256)"
        ];
        const balanceContract = new ethers.Contract(poolContractAddress, balanceAbi, provider);
        const balanceInUSD = await balanceContract.getUserBalanceinUSD(walletAddress);
        setWalletBalance(ethers.formatEther(balanceInUSD));

        // Fetch vault deposits
        const vaultContractAddress = "0xBda761B689b5b9D05E36f8D5A3A5D9be51aCe6c9";
        const vaultContract = new ethers.Contract(vaultContractAddress, vaultABI, provider);
        const [vaultDepositsData] = await vaultContract.getUserVaultDeposits(walletAddress);

        // Fetch vault names
        const names = await Promise.all(
          vaultDepositsData.map(async (deposit: any) => {
            const vaultDetails = await vaultContract.getVault(deposit[2]);
            return vaultDetails[1];
          })
        );
        setVaultNames(names);
      } catch (error) {
        console.error("Error fetching wallet details:", error);
        setPools([]);
        setVaultNames([]);
        setWalletBalance("");
      }
    };

    fetchWalletDetails();
  }, [isWalletConnected, walletAddress]);

  return (
    <div className="md:w-[80%] w-[90%] mx-auto pt-70">
      <div className="flex flex-col md:flex-row gap-16 bg-black text-white p-6 mb-44">
        {/* Wallet Card */}
        <div className="glass rounded-2xl shadow-lg p-6 md:w-[80%] w-full md:px-40 md:py-32 py-20 px-20">
          <div className="flex flex-col md:gap-48 gap-28 justify-between items-center mb-6 mt-20">
            {isWalletConnected && walletAddress ? (
              <>
                <div>
                  <p className="text-sm text-gray-400">Your Wallet:</p>
                  <div className="flex items-center gap-5 justify-center mt-10">
                    <img src={metamask} alt="MetaMask" />
                    <p className="md:text-xl text-m md:font-bold font-semibold">
                      {walletAddress.slice(0, 10)}...{walletAddress.slice(-9)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Wallet Balance:</p>
                  <div className="flex items-center gap-5 justify-center mt-10">
                    <img src={btc} alt="BTC" />
                    <p className="md:text-xl text-m font-bold text-orange-400">${walletBalance}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full">
                <p className="text-lg text-gray-300 mb-6">Please connect your wallet</p>
              </div>
            )}
          </div>
        </div>

        {/* Assets Card */}
        <div className="glass rounded-2xl shadow-xl p-6 md:w-[80%] w-full md:px-40 md:py-32 px-20 py-20">
          {isWalletConnected && walletAddress ? (
            <>
              <p className="text-sm text-gray-400 mb-10">Invested Pools</p>
              <div className="flex flex-col gap-4">
                {pools.map((pool, index) => (
                  <div key={index} className="flex justify-between md:items-center items-start flex-col md:flex-row">
                    <p className="font-semibold">{pool.poolName}</p>
                    <p className="text-orange-400">${ethers.formatEther(pool.depositAmount)}</p>
                  </div>
                ))}
              </div>
              <div className="mt-20">
                <p className="text-sm text-gray-400 mb-10">Vault Deposits</p>
                <div className="flex flex-col gap-4">
                  {vaultNames.map((vaultName, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <p className="font-semibold text-orange-400">{vaultName}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-lg text-gray-300">Please connect your wallet to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mx-auto w-320">
        <div className="flex w-full cursor-pointer items-center rounded border border-white/10 bg-white/5 p-[3px]">
          <div className="relative flex w-full cursor-pointer flex-col items-center rounded md:flex-row md:gap-0">
            {types.map((opt, index) => (
              <div
                key={index}
                className={cn(
                  "w-full py-12 text-center text-sm font-medium capitalize",
                  currentAsset === index ? "text-white" : "text-white/50"
                )}
                onClick={() => setCurretAsset(index)}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Component Switching */}
      <div className="mt-65">
        {currentAsset === 0 ? <InvestedPools /> : <VaultsOverview />}
      </div>
    </div>
  );
};

export default MyAssetsPage;
