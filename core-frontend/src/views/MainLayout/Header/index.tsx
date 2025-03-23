import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import WalletButton from "./WalletButton";
import { headerLinks } from "../../../constants/routes";
import LogoImage from "assets/images/logo.png";
import ConnectWalletButton from "components/ConnectWalletButton";
import { cn } from "lib/utils";
import IconLogo from "assets/icons/IconLogo";
import EthereumLogo from "assets/icons/ethereum-logo.png";
import BnbLogo from "assets/icons/bnb-logo.png"; 

const Header: React.FC = () => {
  const links = headerLinks;
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [currentNetwork, setCurrentNetwork] = useState("bnb");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedSubMenus, setExpandedSubMenus] = useState<number[]>([]);

  const handleNetworkChange = async () => {
    if (window.ethereum) {
      try {
        if (currentNetwork === "bnb") {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x1" }], // Ethereum Mainnet
          });
          setCurrentNetwork("eth");
          toast.success("Switched to Ethereum Mainnet");
        } else {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0x61" }], // BNB Smart Chain Testnet
          });
          setCurrentNetwork("bnb");
          toast.success("Switched to BNB Smart Chain Testnet");
        }
      } catch (error) {
        console.error("Failed to switch network", error);
        toast.error("Failed to switch network");
      }
    } else {
      alert("MetaMask or compatible wallet not found.");
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleSubMenu = (index: number) => {
    if (expandedSubMenus.includes(index)) {
      setExpandedSubMenus(expandedSubMenus.filter((i) => i !== index));
    } else {
      setExpandedSubMenus([...expandedSubMenus, index]);
    }
  };

  return (
    <div>
      <div className="bg-gradient-to-t from-black via-black to-emerald-900 absolute h-[15rem] z-[-1] blur-[100rem] w-full"></div>
      <div className="w-full bg-dark-200 text-white border-b-[1px] border-b-white/10 px-20 py-20 flex items-center gap-16 relative">
        <div className="flex items-center justify-between w-full mx-auto max-w-1220">
          <Link
            to="/dashboard"
            className="flex items-center justify-center gap-4 mr-20 md:w-[10rem] w-[7rem]"
          >
            <IconLogo />
          </Link>

          {/* Desktop routes */}
          <div className="hidden md:flex items-center justify-center gap-1">
            {links.map((link: any, index: any) => (
              <div className={cn("group relative flex flex-auto")} key={index}>
                <Link
                  to={link.url}
                  target={!link.url.startsWith("/") ? "_blank" : undefined}
                  className={`hover:text-white border-b-2 border-t-2 border-transparent m-transition-color hidden md:flex md:justify-center md:items-center ${
                    pathname.includes(link.url)
                      ? " text-white border-b-primary"
                      : "text-light-300"
                  }`}
                >
                  <div
                    className={`flex gap-10 items-center justify-center py-12 px-25 ${
                      pathname.includes(link.url)
                        ? "border border-[#FFFFFF66] bg-[#E6E6E61A] rounded-10"
                        : ""
                    }`}
                  >
                    <div className="relative w-18 h-18">
                      <link.icon className="w-18 h-18" />
                      {pathname.includes(link.url) && (
                        <div className="absolute w-0 h-0 top-1/2 left-1/2 text-white rounded-lg before:content-[''] before:absolute before:inset-0 before:rounded-lg shadow-[0_0_50px_20px_rgba(255,255,255,0.8)]"></div>
                      )}
                    </div>
                    {link.name}
                  </div>
                </Link>
                {link.subMenus && link.subMenus.length > 0 && (
                  <div className="border border-[#FFFFFF1A] text-light bg-[#1E1E1EB2] py-10 px-24 rounded-[10px] absolute left-1/2 top-full hidden w-max min-w-[150px] -translate-x-1/2 flex-col p-2 [box-shadow:0px_0px_24px_0px_rgba(0,_0,_0,_0.08)] group-hover:flex">
                    {link.subMenus?.map((menu: any, index: any) => (
                      <>
                        <div
                          key={index}
                          className={cn(
                            "relative flex cursor-pointer items-center"
                          )}
                          onClick={() => navigate(menu.url)}
                        >
                          <p className="w-full text-[#8D8D8D] text-12 py-8 hover:bg-gradient-to-t hover:text-[#FFF]">
                            {menu.name}
                          </p>
                        </div>
                        {index < link.subMenus.length - 1 && (
                          <div className="w-full h-1 bg-gradient-to-r from-[#888888] via-[#7E7E7E00] to-[#888888]"></div>
                        )}
                      </>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          {/* routes end */}

          <div className="flex items-center gap-10">
            {/* <button
              onClick={handleNetworkChange}
              className="md:block hidden"
            >
              {currentNetwork === "bnb" ? (
                <img src={BnbLogo} alt="BNB" className="w-36 rounded-full" />
              ) : (
                <img src={EthereumLogo} alt="Ethereum" className="w-36 rounded-full" />
              )}
            </button> */}
            <ConnectWalletButton />
            
            {/* Hamburger Menu Icon for Mobile */}
            <div className="md:hidden cursor-pointer ml-4" onClick={toggleMobileMenu}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 12H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 6H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 18H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu Sidebar from the right */}
      <div 
        className={`fixed top-0 right-0 bottom-0 bg-black/95 backdrop-blur-md w-4/5 max-w-[270px] z-50 transition-transform duration-300 ease-in-out px-10 py-20 ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        } md:hidden overflow-y-auto border-l border-gray-800 shadow-xl`}
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <IconLogo />
          </div>
          <div className="cursor-pointer p-2" onClick={toggleMobileMenu}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        <div className="py-6 px-4">
          {links.map((link: any, index: any) => (
            <div key={index} className="mb-3">
              <div 
                className={`flex justify-between items-center p-3 rounded-lg transition-all duration-200 ${
                  pathname.includes(link.url) 
                    ? "text-white bg-[#1a1a1a] border border-gray-800" 
                    : "text-gray-300 hover:bg-[#1a1a1a]"
                }`}
              >
                <Link
                  to={link.url}
                  target={!link.url.startsWith("/") ? "_blank" : undefined}
                  className="flex items-center gap-3 flex-1"
                  onClick={() => {
                    if (!link.subMenus?.length) {
                      setIsMobileMenuOpen(false);
                    }
                  }}
                >
                  <div className="relative w-18 h-18">
                    <link.icon className="w-18 h-18" />
                  </div>
                  <span className="text-xl font-medium">{link.name}</span>
                </Link>
                {link.subMenus && link.subMenus.length > 0 && (
                  <div 
                    className="cursor-pointer p-2"
                    onClick={() => toggleSubMenu(index)}
                  >
                    <svg 
                      width="12" 
                      height="12" 
                      viewBox="0 0 12 12" 
                      fill="none" 
                      xmlns="http://www.w3.org/2000/svg"
                      className={`transition-transform duration-300 ${expandedSubMenus.includes(index) ? 'rotate-180' : ''}`}
                    >
                      <path d="M2 4L6 8L10 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </div>
              {link.subMenus && link.subMenus.length > 0 && expandedSubMenus.includes(index) && (
                <div className="ml-8 mt-2 border-l border-gray-800 pl-4 py-2 bg-[#0f0f0f] rounded-r-lg">
                  {link.subMenus.map((menu: any, subIndex: any) => (
                    <div key={subIndex}>
                      <Link
                        to={menu.url}
                        className="block py-2.5 px-2 text-lg text-gray-400 hover:text-white transition-colors duration-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {menu.name}
                      </Link>
                      {subIndex < link.subMenus.length - 1 && (
                        <div className="w-full h-px bg-gradient-to-r from-gray-800 via-transparent to-gray-800 my-1.5"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* <div className="w-full p-6 border-t border-gray-800 bg-black/50 backdrop-blur-md">
          <div className="flex items-center justify-between font-semibold">
            Switch Network
            <button
              onClick={handleNetworkChange}
              className="flex items-center gap-4 bg-[#1a1a1a] p-4 px-12 rounded-lg border border-gray-800"
            >
              {currentNetwork === "bnb" ? (
                <>
                  <img src={BnbLogo} alt="BNB" className="w-20 h-20 rounded-full" />
                  <span className="text-m">BNB</span>
                </>
              ) : (
                <>
                  <img src={EthereumLogo} alt="Ethereum" className="w-20 h-20 rounded-full" />
                  <span className="text-m">ETH</span>
                </>
              )}
            </button>
          </div>
        </div> */}
      </div>
      
      {/* Overlay when mobile menu is open */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden" 
          onClick={toggleMobileMenu}
        ></div>
      )}
    </div>
  );
};

export default Header;