import React from "react";
import { Link } from "react-router-dom";
import { Warpper, List, Item, GroupName } from "./CardStyles";

const Card = ({ groupName, GroupStatus, groupNum }) => {
  return (
    <Warpper GroupStatus={GroupStatus}>
      <Link to={`/groups/${groupNum}`}>
        <GroupName>
          Team: {groupNum} {groupName}
        </GroupName>
        <h3>{`${GroupStatus ? "Completed" : "Enter your feedback"}`}</h3>
      </Link>
    </Warpper>
  );
};

export default Card;
