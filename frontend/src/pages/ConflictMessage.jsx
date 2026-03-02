import React, { useState, useEffect } from "react";
import { parseGroupsConflict } from "../utlis/parsing";
import { tokenLoader } from "../utlis/auth";
import { json } from "react-router-dom";

import { ConflictBtn } from "./ConflictMessageStyles";
import { BaseURL } from "../routes/url";

const getGroupData = async (groupNum, classCode) => {
  const token1 = tokenLoader();

  let groupRes = await fetch(
    `${BaseURL}/rate?group_number=${groupNum}&class_code=${classCode}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + token1,
      },
    }
  );

  if (groupRes.status === 422 || groupRes.status === 401) {
    return groupRes;
  }
  if (!groupRes.ok) {
    throw json({ message: "Could not authenticate user." }, { status: 500 });
  }
  const groupResDate = await groupRes.json();
  return groupResDate.data.group_name;
};

const ConflictMessage = ({
  groupName,
  groups,
  currentGroup,
  currentClassCode,
  groupRatingsData,
  isConflicToggle,
  conflictStorageKey,
  initialIndex = 0,
  onIndexChange,
}) => {
  const [secondTempGroups, setSecondTempGroups] = useState([]);
  const [orderedConflictGroups, setOrderedConflictGroups] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [displayConflictNameGroup, setDisplayConflictNameGroup] = useState();
  const [numberOfPromp, setNumberOfPromp] = useState(1);
  const [conflictStartTime, setConflictStartTime] = useState(new Date());

  const [isSavingPairwise, setIsSavingPairwise] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const displayNameGroup = async (groupNum) => {
    try {
      let ConflictNameGroup = await getGroupData(groupNum, currentClassCode);
      setDisplayConflictNameGroup(ConflictNameGroup);
    } catch (err) {
      console.error("Error loading group name:", err);
      setDisplayConflictNameGroup("Unknown");
    }
  };

  useEffect(() => {
    console.log("\n[ConflictMessage] USEEFFECT START");
    console.log(`[ConflictMessage] groups=${JSON.stringify(groups)}`);
    console.log(`[ConflictMessage] currentGroup=${currentGroup}`);
    console.log(`[ConflictMessage] groupRatingsData=${groupRatingsData}`);


    let secondList = [];

    if (groups && groups.length > 0) {
      secondList = groups;
    } else {
      const saved = window.localStorage.getItem(conflictStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          secondList = Array.isArray(parsed.groups) ? parsed.groups : [];
          const savedIndex =
            typeof parsed.currentIndex === "number" ? parsed.currentIndex : 0;
          setCurrentIndex(savedIndex);
        } catch (e) {
          console.error(
            "[ConflictMessage] Failed to parse saved conflict:",
            e
          );
        }
      }
    }

    console.log(
      `[ConflictMessage] secondTempGroups to compare: ${JSON.stringify(
        secondList
      )}`
    );

    setSecondTempGroups(secondList);
    const start = new Date();
    setConflictStartTime(start);
    setNumberOfPromp(1);


    if (secondList.length > 0 && currentIndex >= 0) {
      console.log(
        `[ConflictMessage] Loading name for group ${secondList[currentIndex]}`
      );
      displayNameGroup(secondList[currentIndex]);
    } else if (secondList.length > 0) {
      console.log(
        `[ConflictMessage] Loading name for group ${secondList[0]} (fallback)`
      );
      setCurrentIndex(0);
      displayNameGroup(secondList[0]);
    } else {
      console.log("[ConflictMessage] No groups to compare!");
    }

    console.log("[ConflictMessage] USEEFFECT END\n");
  }, [
    groups,
    groupRatingsData,
    currentGroup,
    currentClassCode,
    conflictStorageKey,
  ]);


  const savePairwise = async (selectedGroup, winner) => {
    const token = tokenLoader();
    const answerTime = new Date();

    setIsSavingPairwise(true);
    setSaveError(null);

    try {
      console.log("\n[savePairwise] SAVING:");
      console.log(
        `[savePairwise]   pairwise_q="${selectedGroup},${currentGroup}"`
      );
      console.log(`[savePairwise]   answer=${winner}`);
      console.log(
        `[savePairwise]   ask_time=${conflictStartTime.toISOString()}`
      );
      console.log(`[savePairwise]   answer_time=${answerTime.toISOString()}`);

      const response = await fetch(BaseURL + "pairwise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          class_code: currentClassCode,
          pairwise_q: `${selectedGroup},${currentGroup}`,
          answer: winner,
          ask_time: conflictStartTime.toISOString(),
          answer_time: answerTime.toISOString(),
        }),
      });

      if (!response.ok) {
        let errorText = "Error saving pairwise";
        try {
          const errorData = await response.json();
          errorText = errorData.msg || errorText;
        } catch (_) {}
        throw new Error(errorText);
      }

      const data = await response.json();
      console.log("[savePairwise] Saved to DB\n", data);


      setIsSavingPairwise(false);
      return true;
    } catch (error) {
      console.error("Error saving pairwise:", error);
      setSaveError(error.message || "Error saving pairwise");
      setIsSavingPairwise(false);
      return false;
    }
  };

  const lowerRatings = async () => {
    const selectedGroup = secondTempGroups[currentIndex];
    console.log(
      `\n[lowerRatings] User selected: Group ${selectedGroup} (vs currentGroup ${currentGroup})`
    );

    const saved = await savePairwise(selectedGroup, selectedGroup);
    if (!saved) {
      console.log("[lowerRatings] savePairwise failed, stay on current conflict");
      return;
    }

    let tempNumQus = numberOfPromp + 1;
    setNumberOfPromp(tempNumQus);
    let orderdConflict = [...orderedConflictGroups];
    orderdConflict.push(secondTempGroups[currentIndex]);

    if (currentIndex === secondTempGroups.length - 1) {
      console.log("[lowerRatings] Last comparison reached, closing conflict");
      isConflicToggle(false);
    } else {
      setOrderedConflictGroups(orderdConflict);
      let tempCurIndex = currentIndex + 1;
      setCurrentIndex(tempCurIndex);
      if (typeof onIndexChange === "function") {
        onIndexChange(tempCurIndex);
        const payload = {
          groups: secondTempGroups,
          currentIndex: tempCurIndex,
        };
        window.localStorage.setItem(
          conflictStorageKey,
          JSON.stringify(payload)
        );
      }
      const newStart = new Date();
      setConflictStartTime(newStart);
      if (secondTempGroups[tempCurIndex]) {
        console.log(
          `[lowerRatings] Moving to next: Group ${secondTempGroups[tempCurIndex]}`
        );
        displayNameGroup(secondTempGroups[tempCurIndex]);
      }
    }
  };

  const higherRatings = async () => {
    const selectedGroup = currentGroup;
    console.log(
      `\n[higherRatings] User selected: currentGroup ${selectedGroup}`
    );

    const saved = await savePairwise(secondTempGroups[currentIndex], selectedGroup);
    if (!saved) {
      console.log("[higherRatings] savePairwise failed, stay on current conflict");
      return;
    }

    let tempNumQus = numberOfPromp + 1;
    setNumberOfPromp(tempNumQus);

    console.log("[higherRatings] Closing conflict");
    isConflicToggle(false);
  };

  const disabledStyle = {
    opacity: isSavingPairwise ? 0.5 : 1,
    cursor: isSavingPairwise ? "not-allowed" : "pointer",
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
        You gave the same evaluation to
        <br />
        Team{" "}
        {secondTempGroups?.length > 0 && currentIndex >= 0
          ? `${secondTempGroups[currentIndex]}: ${displayConflictNameGroup}`
          : "Unknown"}
        <br />
        and
        <br /> Team {currentGroup}: {groupName}
      </h2>
      <p style={{ color: "#000" }}>Which is better ?</p>

      {saveError && (
        <p style={{ color: "red" }}>
          {saveError}
        </p>
      )}

      <div className="actionsBtns" style={{ display: "flex" }}>
        <ConflictBtn
          onClick={lowerRatings}
          disabled={isSavingPairwise}
          style={disabledStyle}
        >
          {isSavingPairwise
            ? "Saving..."
            : `Team ${
                secondTempGroups?.length > 0 && currentIndex >= 0
                  ? secondTempGroups[currentIndex]
                  : "Unknown"
              }`}
        </ConflictBtn>
        <ConflictBtn
          onClick={higherRatings}
          disabled={isSavingPairwise}
          style={disabledStyle}
        >
          {isSavingPairwise ? "Saving..." : `Team ${currentGroup}`}
        </ConflictBtn>
      </div>
    </div>
  );
};

export default ConflictMessage;
