import { useConnectModal } from "@rainbow-me/rainbowkit";
import Button from "components/common/Button";
import ConnectWalletButton from "components/ConnectWalletButton";
import React from "react";
import btc from "../../assets/images/Cam1.png";

const IntroText: React.FC = () => {
  const { openConnectModal } = useConnectModal();

  return (
    <div className="w-[95%] mx-auto flex flex-col items-center justify-center relative">
      <div className="absolute md:right-[4rem] md:top-[-0.3rem] right-[1.8rem] top-[-2.5rem] md:w-[15rem] w-[8rem]"><img src={btc} alt="" /></div>
      <h2 className="md:text-50 text-30 font-[700] flex flex-col md:flex-row justify-center items-center md:gap-8 gap-0">
        <span className="md:scale-100  scale-[1.3]">Bitcoin</span> <span className="text-[#00ECBC]">Risk Management Layer</span>
      </h2>
      <div className="md:text-18 text-10 font-[500] text-[#FFFFFFA3]">
        Securing Bitcoin Ecosystem with Decentralised Insurance Innovation.
      </div>
      <div className="flex items-center justify-center gap-16 mt-45 md:scale-100 scale-[0.85]">
        {/* <Button
          size="lg"
          className="min-w-[216px] rounded-8 bg-gradient-to-r from-[#00ECBC66] to-[#00ECBC80] border border-[#00ECBC] w-full"
          onClick={openConnectModal}
        >
          Connect Wallet
        </Button> */}
        <ConnectWalletButton className="md:min-w-[216px] min-w-[160px] rounded-8 bg-gradient-to-r from-[#00ECBC66] to-[#00ECBC80] border border-[#00ECBC] w-full py-12" />
        <Button
          variant="outline"
          size="lg"
          className="rounded-8 md:max-w-[316px] min-w-[200px] text-sm md:text-lg py-7 md:py-11"
          onClick={() => window.open('https://docs.bqlabs.xyz/', '_blank')}
        >
          Read BQ Labs Docs
        </Button>

      </div>
    </div>
  );
};

export default IntroText;
