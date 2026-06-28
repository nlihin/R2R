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
  initialLow,
  initialHigh,
  conflictStartedAt,
  onBoundsChange,
  allowConflictNavigation,
}) => {
  const [secondTempGroups, setSecondTempGroups] = useState([]);
  const [low, setLow] = useState(typeof initialLow === "number" ? initialLow : 0);
  const [high, setHigh] = useState(typeof initialHigh === "number" ? initialHigh : -1);
  const [displayConflictNameGroup, setDisplayConflictNameGroup] = useState();
  const [conflictStartTime, setConflictStartTime] = useState(new Date());


  const [isSavingPairwise, setIsSavingPairwise] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const mid = low <= high ? Math.floor((low + high) / 2) : -1;


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


    let secondList = [];

    if (groups && groups.length > 0) {
      secondList = groups;
    } else {
      const saved = window.localStorage.getItem(conflictStorageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          secondList = Array.isArray(parsed.groups) ? parsed.groups : [];
          if (typeof parsed.low === "number") setLow(parsed.low);
          if (typeof parsed.high === "number") setHigh(parsed.high);
        } catch (e) {
          console.error("[ConflictMessage] Failed to parse saved conflict:", e);
        }
      }
    }


    setSecondTempGroups(secondList);

    if (secondList.length > 0) {
      if (high < 0) {
        setHigh(secondList.length - 1);
      }
      const startMid = Math.floor(
        ((typeof initialLow === "number" ? initialLow : 0) +
          (typeof initialHigh === "number" && initialHigh >= 0
            ? initialHigh
            : secondList.length - 1)) /
          2
      );
      console.log(`[ConflictMessage] Loading name for group ${secondList[startMid]}`);
      displayNameGroup(secondList[startMid]);
    }

    setConflictStartTime(new Date());
    console.log("[ConflictMessage] USEEFFECT END\n");
  }, [groups, currentGroup, currentClassCode, conflictStorageKey]);


  const buildConflictPayload = (groupsList, lowVal, highVal) => {
    const payload = {
      groups: groupsList,
      low: lowVal,
      high: highVal,
    };
    if (conflictStartedAt) {
      payload.conflictStartedAt = conflictStartedAt;
    }
    return payload;
  };

  const finishConflict = async () => {
    const token = tokenLoader();
    setIsSavingPairwise(true);
    setSaveError(null);

    try {
      const response = await fetch(BaseURL + "rate/complete-pairwise", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          group_number: parseInt(currentGroup, 10),
        }),
      });

      if (!response.ok) {
        let errorText = "Could not complete comparison";
        try {
          const errorData = await response.json();
          errorText = errorData.msg || errorText;
        } catch (_) {}
        throw new Error(errorText);
      }

      window.localStorage.removeItem(conflictStorageKey);
      if (typeof allowConflictNavigation === "function") {
        allowConflictNavigation();
      }
      isConflicToggle(false);
    } catch (error) {
      console.error("[finishConflict] Error:", error);
      setSaveError(error.message || "Could not complete comparison");
      window.alert(error.message || "Could not complete comparison");
    } finally {
      setIsSavingPairwise(false);
    }
  };


  const savePairwise = async (selectedGroup, winner) => {
    const token = tokenLoader();
    const answerTime = new Date();

    setIsSavingPairwise(true);
    setSaveError(null);

    try {
      console.log("\n[savePairwise] SAVING:");
      console.log(`[savePairwise]   pairwise_q="${selectedGroup},${currentGroup}"`);
      console.log(`[savePairwise]   answer=${winner}`);
      console.log(`[savePairwise]   ask_time=${conflictStartTime.toISOString()}`);
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
    const selectedGroup = secondTempGroups[mid];
    console.log(
      `\n[lowerRatings] User selected: Group ${selectedGroup} (vs currentGroup ${currentGroup})`
    );
    console.log(`[lowerRatings] Binary search state: low=${low}, high=${high}, mid=${mid}`);

    const saved = await savePairwise(selectedGroup, selectedGroup);
    if (!saved) {
      console.log("[lowerRatings] savePairwise failed, stay on current conflict");
      return;
    }


    const newLow = mid + 1;
    setLow(newLow);
    setConflictStartTime(new Date());

    console.log(`[lowerRatings] New bounds: low=${newLow}, high=${high}`);

    if (newLow > high) {
      console.log("[lowerRatings] Binary search complete, closing conflict");
      finishConflict();
    } else {
      const newMid = Math.floor((newLow + high) / 2);
      if (typeof onBoundsChange === "function") {
        onBoundsChange(newLow, high);
        window.localStorage.setItem(
          conflictStorageKey,
          JSON.stringify(
            buildConflictPayload(secondTempGroups, newLow, high)
          )
        );
      }
      console.log(`[lowerRatings] Next comparison: groups[${newMid}] = ${secondTempGroups[newMid]}`);
      displayNameGroup(secondTempGroups[newMid]);
    }
  };

  const higherRatings = async () => {
    const selectedGroup = currentGroup;
    console.log(
      `\n[higherRatings] User selected: currentGroup ${selectedGroup}`
    );
    console.log(`[higherRatings] Binary search state: low=${low}, high=${high}, mid=${mid}`);

    const saved = await savePairwise(secondTempGroups[mid], selectedGroup);
    if (!saved) {
      console.log("[higherRatings] savePairwise failed, stay on current conflict");
      return;
    }


    const newHigh = mid - 1;
    setHigh(newHigh);
    setConflictStartTime(new Date());

    console.log(`[higherRatings] New bounds: low=${low}, high=${newHigh}`);

    if (low > newHigh) {
      console.log("[higherRatings] Binary search complete, closing conflict");
      finishConflict();
    } else {
      const newMid = Math.floor((low + newHigh) / 2);
      if (typeof onBoundsChange === "function") {
        onBoundsChange(low, newHigh);
        window.localStorage.setItem(
          conflictStorageKey,
          JSON.stringify(
            buildConflictPayload(secondTempGroups, low, newHigh)
          )
        );
      }
      console.log(`[higherRatings] Next comparison: groups[${newMid}] = ${secondTempGroups[newMid]}`);
      displayNameGroup(secondTempGroups[newMid]);
    }
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
        {secondTempGroups?.length > 0 && mid >= 0
          ? `${secondTempGroups[mid]}: ${displayConflictNameGroup}`
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
                secondTempGroups?.length > 0 && mid >= 0
                  ? secondTempGroups[mid]
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
