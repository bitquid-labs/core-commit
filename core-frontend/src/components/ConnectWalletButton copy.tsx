import React, { useEffect, useState } from "react";
import { connect, disconnect } from "@wagmi/core";
import { injected } from "@wagmi/connectors";
import config from "lib/config";
import Button from "./common/Button";
import { useAccount } from "wagmi";
import IconWalletHeader from "assets/icons/IconWalletHeader";

type ButtonProps = {
  className?: string;
};

const ConnectWalletButton: React.FC<ButtonProps> = ({ className }) => {
  const { address, connector } = useAccount();
  const [isMobile, setIsMobile] = useState(false);

  // Check if user is on mobile device
  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      
      // Check if mobile device
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|windows phone/i.test(userAgent);
      setIsMobile(isMobileDevice);
    };

    checkMobile();
  }, []);

  const truncateAddress = (address: string) => {
    return address.slice(0, 6) + "..." + address.slice(-4);
  };

  const handleConnect = async () => {
    if (isMobile) {
      // Check if MetaMask is installed by looking for ethereum object
      const ethereum = (window as any).ethereum;
      
      if (ethereum && ethereum.isMetaMask) {
        // Use wagmi connect for MetaMask on mobile
        await connect(config, { connector: injected() });
      } else {
        // For mobile, use deep linking to open MetaMask app if installed
        // or redirect to app store
        const dappUrl = window.location.href;
        const metamaskAppDeepLink = `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}`;
        
        window.location.href = metamaskAppDeepLink;
      }
    } else {
      // Regular desktop connection
      await connect(config, { connector: injected() });
    }
  };

  const handleDisconnect = async () => {
    await disconnect(config, {
      connector,
    });
  };

  return (
    <>
      {address ? (
        <Button
          className={className || "bg-[#F6F6F6] rounded-12 flex items-center gap-4 md:py-12 md:px-20 md:text-m text-[12px] px-14 py-4 text-[#0A0A0A]"}
          onClick={handleDisconnect}
        >
          {truncateAddress(address)}
        </Button>
      ) : (
        <Button className="bg-[#F6F6F6] rounded-12 flex items-center gap-4 md:py-12 md:px-20 px-14 py-4 md:text-m text-[12px]" onClick={handleConnect}>
          <span className="text-[#0A0A0A]">Connect Wallet</span>
          <IconWalletHeader />
        </Button>
      )}
    </>
  );
};

export default ConnectWalletButton;