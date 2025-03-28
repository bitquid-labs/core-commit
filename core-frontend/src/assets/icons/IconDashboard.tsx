import React from "react";

import { IIcon } from "types/common";

const IconDashboard: React.FC<IIcon> = ({ className }) => {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      className={className || ""}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 18H2C0.9 18 0 17.1 0 16V2C0 0.9 0.9 0 2 0H6C7.1 0 8 0.9 8 2V16C8 17.1 7.1 18 6 18ZM12 18H16C17.1 18 18 17.1 18 16V11C18 9.9 17.1 9 16 9H12C10.9 9 10 9.9 10 11V16C10 17.1 10.9 18 12 18ZM18 5V2C18 0.9 17.1 0 16 0H12C10.9 0 10 0.9 10 2V5C10 6.1 10.9 7 12 7H16C17.1 7 18 6.1 18 5Z"
        fill="white"
      />
    </svg>
  );
};

export default IconDashboard;
