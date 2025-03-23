import React, { useEffect, useState } from "react";
import ConnectButton from '../config/appkit-config'


type ButtonProps = {
  className?: string;
};

const ConnectWalletButton: React.FC<ButtonProps> = ({ className }) => {
  
  return (
    <>
      <ConnectButton />
    </>
  );
};

export default ConnectWalletButton;