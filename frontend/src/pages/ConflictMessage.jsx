import React, { useState } from "react";
import { useEffect } from "react";
import { reverseParseGroupsConflict } from "../utlis/parsing";
// import { conflictsChecks } from "../utlis/conflictsCheckess";
import { parseGroupsConflict } from "../utlis/parsing";
import { tokenLoader } from "../utlis/auth";
import { json } from "react-router-dom";

import { ConflictBtn } from "./ConflictMessageStyles";
import { BaseURL } from "../routes/url";

const getGroupData = async (groupNum) => {
  const token1 = tokenLoader();
  const baseURL = "https://rate2rank-0d561bf6674a.herokuapp.com/";
  let groupResDate;
  let groupRes = await fetch(`${baseURL}/rate?group_number=${groupNum}`, {

    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + token1,
    },
    // body: JSON.stringify({ group_number: groupNumInt }),
  });
  // TODO: raise errors to user
  if (groupRes.status === 422 || groupRes.status === 401) {
    return groupRes;
  }
  if (!groupRes.ok) {
    throw json({ message: "Could not authenticate user." }, { status: 500 });
  }
  groupResDate = await groupRes.json();
  return groupResDate.data.group_name;
};

const ConflictMessage = ({
  groupName,
  groups,
  currentGroup,
  groupRatingsData,
  isConflicToggle,
}) => {
  const [convertedGroups, setConvertedGroups] = useState([]);
  const [firstTempGroups, setFirstTempGroups] = useState([]);
  const [secondTempGroups, setSecondTempGroups] = useState([]);
  const [thirdTempGroups, setThirdTempGroups] = useState([]);
  const [orderedConflictGroups, setOrderedConflictGroups] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [displayConflictNameGroup, setDisplayConflictNameGroup] = useState();
  const [numberOfPromp, setNumberOfPromp] = useState(0);

  const displayNameGroup = async (groupNum) => {
    let ConflictNameGroup = await getGroupData(groupNum);
    setDisplayConflictNameGroup(ConflictNameGroup);
  };

  useEffect(() => {
    const convertedGroups = parseGroupsConflict(groups);
    const firstList = [];
    const secondList = [];
    const thirdList = [];

    for (let i = 0; i < convertedGroups.length; i++) {
      const [first, second] = convertedGroups[i];

      if (second === groupRatingsData) {
        secondList.push([first, second]);
      } else if (second < groupRatingsData) {
        thirdList.push([first, second]);
      } else {
        firstList.push([first, second]);
      }
    }
    setConvertedGroups(convertedGroups);
    setFirstTempGroups(firstList);
    setSecondTempGroups(secondList);
    setThirdTempGroups(thirdList);
    setCurrentIndex(0);
    displayNameGroup(secondList[0][0]);
  }, [groups]); //changes

  const finishConflict = async (orderdConflict) => {
    const baseURL = "https://rate2rank-0d561bf6674a.herokuapp.com/";

    const tok = tokenLoader();

    let result = [...firstTempGroups, ...orderdConflict, ...thirdTempGroups];
    const orderedConflict = reverseParseGroupsConflict(result);
    let payload = {
      list_rank: orderedConflict,
      number_questions: numberOfPrompex,
    };
    let res = await fetch(BaseURL + "rank", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + tok,
      },
      body: JSON.stringify(payload),
    });

    isConflicToggle(false);
  };

  const lowerRatings = () => {
    let tempNumQus = numberOfPromp + 1;
    setNumberOfPromp(tempNumQus);
    let orderdConflict = orderedConflictGroups;
    orderdConflict.push(secondTempGroups[currentIndex]);
    if (currentIndex === secondTempGroups.length - 1) {
      orderdConflict.push([currentGroup, groupRatingsData]);
      setOrderedConflictGroups(orderdConflict);
      finishConflict(orderdConflict, tempNumQus);
    } else {
      setOrderedConflictGroups(orderdConflict);
    }
    let tempCurIndex = currentIndex + 1;
    setCurrentIndex(tempCurIndex);
    displayNameGroup(secondTempGroups[tempCurIndex][0]);
    // setAnswer(false);
  };
  const higherRatings = () => {
    let tempNumQus = numberOfPromp + 1;
    setNumberOfPromp(tempNumQus);
    let orderdConflict = orderedConflictGroups;

    orderdConflict.push([parseInt(currentGroup), groupRatingsData]);
    orderdConflict = [
      ...orderdConflict,
      ...secondTempGroups.slice(currentIndex),
    ];
    setOrderedConflictGroups(orderdConflict, tempNumQus);
    finishConflict(orderdConflict, tempNumQus);
    // setAnswer(true);
  };
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: "15px",
      }}
    >
      <h2 style={{ color: "#000" }}>
        You gave the same evaluation to team:
        {/* {displayNameGroup(secondTempGroups[currentIndex][0])} */}
        {secondTempGroups?.length > 0 ? (
          <span>
            {" "}
            {secondTempGroups[currentIndex][0]}{" "}
            {displayConflictNameGroup ? displayConflictNameGroup : ""}
          </span>
        ) : (
          "czxczx"
        )}{" "}
        and team:{currentGroup} {groupName}
      </h2>
      <p style={{ color: "#000" }}>
        Which is better ?<br />
        {/* {secondTempGroups.length > 0
          ? secondTempGroups[currentIndex][0]
          : "czxczx"}{" "}
        or {currentGroup} */}
      </p>
      <div className="actionsBtns" style={{ display: "flex" }}>
        <ConflictBtn onClick={() => lowerRatings()}>
          Team:
          {secondTempGroups?.length > 0
            ? secondTempGroups[currentIndex][0]
            : "czxczx"}
        </ConflictBtn>
        <ConflictBtn onClick={() => higherRatings()}>
          Team:{currentGroup}
        </ConflictBtn>
      </div>
    </div>
  );
};

export default ConflictMessage;
