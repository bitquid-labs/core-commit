import SectionTitle from "components/common/SectionTitle";
import { getRiskTypeName } from "lib/number";
import React from "react";
import { IPool } from "types/common";
import IconDownIcon from "assets/icons/IconDown";
import networkBSCIcon from "assets/images/network_bsc.png";
import { formatEther } from "viem";

type IPoolWithDetails = IPool & {
  displayDetails: boolean;
};

type Props = {
  poolData: IPoolWithDetails[];
  handleDeposit: (poolId: number) => void;
  sectionTitle: string;
  setPoolsData: (prev: any) => void;
};

const PoolList: React.FC<Props> = ({
  poolData,
  handleDeposit,
  sectionTitle,
  setPoolsData,
}) => {
  return (
    <div className="w-full">
      <div className="mt-80 mb-57">
        <SectionTitle title={sectionTitle} />
      </div>
      <div className="w-full">
        <table className="w-full text-white">
          <thead className="">
            <tr className="md:[&>th]:text-20 [&>th]:text-10 [&th]:font-500 h-45">
              <th className=""></th>
              <th className="">Rating</th>
              <th className="">APY</th>
              <th className="">Min Tenure</th>
              <th className=""></th>
            </tr>
          </thead>
          <tbody>
            {poolData.map((pool, index) => (
              <>
                <tr className="px-8 text-center md:text-lg text-[12px]" key={index}>
                  <td className="font-[400] bg-[#1F1F1F] py-24 rounded-l-8">
                    <div className="flex items-center justify-start w-full max-w-[105px] md:max-w-[305px] gap-12 md:pl-15 pl-9">
                      {pool.displayDetails ? (
                        <IconDownIcon className="hidden lg:block" />
                      ) : (
                        <IconDownIcon className="hidden lg:block -rotate-90" />
                      )}

                      {pool.poolName}
                    </div>
                  </td>
                  <td className="font-[500] bg-[#1F1F1F] py-24">
                    {pool.rating}
                  </td>
                  <td className="font-[500] bg-[#1F1F1F] py-24">
                    {Number(pool.apy)}%
                  </td>
                  <td className="font-[400] bg-[#1F1F1F] py-24 rounded-r-8">
                    {Number(pool.minPeriod)}Days
                  </td>
                  <td className="bg-transparent">
                    <button
                      onClick={() => handleDeposit(Number(pool.id))}
                      className="bg-[#00ECBC66] border border-[#00ECBC] md:px-45 md:py-7 py-6 px-16 rounded-8 md:ml-0 ml-8"
                    >
                      Invest
                    </button>
                  </td>
                </tr>

                <tr className="text-center">
                  <td className="font-[400] md:w-[80%] w-full md:px-16 px-0 p-2 pt-0" colSpan={4}>
                    <div className="bg-[#3D3D3D] rounded-b-4">
                      {!pool.displayDetails ? (
                        <></>
                      ) : (
                        <div className="flex w-full md:px-45 md:py-25 p-2 md:pt-10 pt-5">
                          <div className="flex w-[30%] md:w-[50%] flex-col items-center justify-center md:px-54 px-1 gap-12">
                            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-1 justify-between w-full">
                              <span className="md:text-22 text-12 font-[600]">
                                Network
                              </span>
                              <img
                                src={networkBSCIcon}
                                className="h-24 w-25"
                                alt="network_bsc"
                              />
                              {/* <span>{pool.details.network}</span> */}
                            </div>
                          </div>
                          <div className="flex w-[65%] md:w-[60%] flex-col items-center justify-center md:px-54 px-1 gap-12">
                            <div className="flex items-center justify-between w-full">
                              <span className="md:text-14 text-12 font-[400]">
                                Risk Covered
                              </span>
                              <span className="text-[#00ECBC] md:text-14 text-12 font-[600]">
                                {getRiskTypeName(pool.riskType)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between w-full">
                              <span className="md:text-14 text-12 font-[400]">TVL</span>
                              <span className="md:text-14 text-12 font-[800]">
                                {formatEther(pool.tvl || 0n)}
                              </span>
                            </div>
                            {/* <div className="flex items-center justify-between w-full">
                              <span className="text-14 font-[400]">
                                Investment Arm %
                              </span>
                              <span className="text-14 font-[800]">
                                {Number(pool.investmentArmPercent)} %
                              </span>
                            </div> */}
                            {/* <div className="flex items-center justify-between w-full">
                              <span className="text-14 font-[400]">
                                Cover Purchase %
                              </span>
                              <span className="text-14 font-[800]">
                                {100 - Number(pool.investmentArmPercent)} %
                              </span>
                            </div> */}
                          </div>
                        </div>
                      )}
                      <div
                        className="flex items-center justify-center w-full gap-5 py-8 cursor-pointer mb-10 md:pb-4"
                        onClick={() => {
                          setPoolsData((prev: any) =>
                            prev.map((pool: any, i: number) =>
                              i === index
                                ? {
                                  ...pool,
                                  displayDetails: !pool.displayDetails,
                                }
                                : pool
                            )
                          );
                        }}
                      >
                        <span>More Details</span>{" "}
                        {pool.displayDetails ? (
                          <IconDownIcon className="rotate-180" />
                        ) : (
                          <IconDownIcon />
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PoolList;
