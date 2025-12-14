import React, { useState } from "react";
import { useEffect } from "react";
import { reverseParseGroupsConflict } from "../utlis/parsing";
// import { conflictsChecks } from "../utlis/conflictsCheckess";
import { parseGroupsConflict } from "../utlis/parsing";
import { tokenLoader } from "../utlis/auth";
import { json } from "react-router-dom";

import { ConflictBtn } from "./ConflictMessageStyles";
import { BaseURL } from "../routes/url";

const getGroupData = async (groupNum, classCode) => {
  const token1 = tokenLoader();

  let groupResDate;
  let groupRes = await fetch(`${BaseURL}/rate?group_number=${groupNum}&class_code=${classCode}`, {
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
  currentClassCode,
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
  const [numberOfPromp, setNumberOfPromp] = useState(1);
  const [conflictStartTime, setConflictStartTime] = useState(new Date());

  const currentGroupKey = `${currentClassCode}:${currentGroup}`;


  const displayNameGroup = async (groupNum) => {
    let ConflictNameGroup = await getGroupData(groupNum, currentClassCode);
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
    setConflictStartTime(new Date());
    
    if (secondList.length > 0) {
      displayNameGroup(secondList[0][0]); 
    }
  }, [groups]);


  const savePairwise = async (selectedGroup, winner) => {
    const token = tokenLoader();
    const answerTime = new Date();
    
    try {
      await fetch(BaseURL + 'pairwise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer ' + token,
        },
        body: JSON.stringify({
          class_code: currentClassCode,
          pairwise_q: `${selectedGroup},${currentGroup}`,
          answer: winner,
          ask_time: conflictStartTime.toISOString(),
          answer_time: answerTime.toISOString(),
        }),
      });
    } catch (error) {
      console.error('Error saving pairwise:', error);
    }
  };


  const finishConflict = async (orderdConflict) => {
    const tok = tokenLoader();

    let result = [...firstTempGroups, ...orderdConflict, ...thirdTempGroups];
    const orderedConflict = reverseParseGroupsConflict(result);
    let payload = {
      list_rank: orderedConflict,
      number_questions: numberOfPromp,
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

  const lowerRatings = async () => {
    const selectedGroup = secondTempGroups[currentIndex][0];
    await savePairwise(selectedGroup, selectedGroup);


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
      let tempCurIndex = currentIndex + 1;
      setCurrentIndex(tempCurIndex);
      setConflictStartTime(new Date());
      if (secondTempGroups[tempCurIndex]) {
        displayNameGroup(secondTempGroups[tempCurIndex][0]);
      }
    }
  };
  
  const higherRatings = async () => {
    const selectedGroup = currentGroup;
    await savePairwise(secondTempGroups[currentIndex][0], selectedGroup);

    let tempNumQus = numberOfPromp + 1;
    setNumberOfPromp(tempNumQus);
    let orderdConflict = orderedConflictGroups;

    orderdConflict.push([parseInt(currentGroup), groupRatingsData]);
    orderdConflict = [
      ...orderdConflict,
      ...secondTempGroups.slice(currentIndex + 1),
    ];
    setOrderedConflictGroups(orderdConflict);
    finishConflict(orderdConflict, tempNumQus);
  };
  
  // if (secondTempGroups.length === 0) {
  //   return (
  //     <div style={{ textAlign: "center", color: "#000" }}>
  //       <h2>No conflicts</h2>
  //     </div>
  //   );
  // }

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
        You gave the same evaluation to<br /> Team
        {secondTempGroups?.length > 0 && currentIndex >= 0 ? (
          <span>
            {" "}
            {secondTempGroups[currentIndex][0]}: {displayConflictNameGroup}
          </span>
        ) : (
          "Unknown"
        )}
        <br />
        and
        <br /> Team {currentGroup}: {groupName}
      </h2>
      <p style={{ color: "#000" }}>Which is better ?</p>
      <div className="actionsBtns" style={{ display: "flex" }}>
        <ConflictBtn onClick={() => lowerRatings()}>
          Team{" "}
          {secondTempGroups?.length > 0 && currentIndex >= 0
            ? secondTempGroups[currentIndex][0]
            : "Unknown"}
        </ConflictBtn>
        <ConflictBtn onClick={() => higherRatings()}>
          Team {currentGroup}
        </ConflictBtn>
      </div>
    </div>
  );
};

export default ConflictMessage;
