import React from "react";
import { Link } from "react-router-dom";
import { Warpper, List, Item, GroupName } from "./CardStyles";

const Card = ({ groupName, GroupStatus, groupNum, classCode }) => {
  return (
    <Warpper GroupStatus={GroupStatus}>
      <Link to={`/groups/${classCode}/${groupNum}`}>
        <GroupName>
          Team {groupNum}: {groupName}
        </GroupName>
        <h3>{`${GroupStatus ? "Completed" : "Enter your feedback"}`}</h3>
      </Link>
    </Warpper>
  );
};

export default Card;
