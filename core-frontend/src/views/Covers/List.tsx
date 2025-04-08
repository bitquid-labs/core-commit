import React from "react";
import { ICover } from "types/common";
import { Cover } from "./Cover";

type ListType = {
  covers: ICover[];
  userCoverIds: (bigint | undefined)[];
}

const List: React.FC<ListType> = ({covers, userCoverIds}) => {
  return (
    <div className='grid md:w-full w-[90%] mx-auto md:grid-cols-3 grid-cols-1 gap-48'>
      {covers.map((cover: ICover, index) => (
        <Cover key={index} cover={cover} disabled={userCoverIds.includes(cover.id!)} />
      ))}
    </div>
  );
};

export default List;