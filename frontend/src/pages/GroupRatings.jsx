import { useEffect, useState, useRef } from "react";
import { Link, useParams, json, useNavigate, useBlocker } from "react-router-dom";

import BasicModal from "../components/BasicModal";
import QesCard from "../components/QesCard";
import ExtraQus from "../components/ExtraQus";

import { tokenLoader } from "../utlis/auth";
import { BaseURL } from "../routes/url";

import {
  Warpper,
  GroupName,
  ButtonContainer,
  BackButton,
} from "./GroupRatingsStyles";
import ConflictMessage from "./ConflictMessage";

const PAIRWISE_LEAVE_MSG =
  "You have not finished the comparison. Leave and discard this rating?";

const GroupRatings = () => {
  const params = useParams();
  const navigate = useNavigate();
  const [groupData, setGroupData] = useState();
  const [feedback1, setFeedback1Data] = useState();
  const [crowdRatingsData, setCrowdRatingsData] = useState();
  const [groupRatingsData, setGroupRatingsData] = useState();
  const [otherQuestionsData, setOtherQuestionsData] = useState({});
  const [isConflict, setIsConflict] = useState(false);
  const [dataConflict, setDataConflict] = useState();
  const [conflictLow, setConflictLow] = useState(0);
  const [conflictHigh, setConflictHigh] = useState(-1);
  const [conflictStartedAt, setConflictStartedAt] = useState(null);
  const suppressNavigationGuardRef = useRef(false);
  // const [questions, setQuestions] = useState(["hey", "roi", "yoni"]);
  const [modalToggle, setModalToggle] = useState(false);
  const [modalText, setModalText] = useState();
  const [btsEnabled, setBtsEnabled] = useState(true);

  // const titles = ["גרוע", "לא טוב", "בינוני", "טוב", "מצוין"];

  const conflictStorageKey = `r2r_pairwise_conflict_${params.classCode}_${params.groupId}`;


  useEffect(() => {
    const saved = window.localStorage.getItem(conflictStorageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const groups = Array.isArray(parsed.groups) ? parsed.groups : [];
        const savedLow = typeof parsed.low === "number" ? parsed.low : 0;
        const savedHigh =
          typeof parsed.high === "number" ? parsed.high : groups.length - 1;
        if (groups.length > 0 && savedLow <= savedHigh) {
          const startedAt =
            typeof parsed.conflictStartedAt === "string"
              ? parsed.conflictStartedAt
              : new Date().toISOString();
          setIsConflict(true);
          setDataConflict(groups);
          setConflictLow(savedLow);
          setConflictHigh(savedHigh);
          setConflictStartedAt(startedAt);
          if (typeof parsed.conflictStartedAt !== "string") {
            window.localStorage.setItem(
              conflictStorageKey,
              JSON.stringify({
                groups,
                low: savedLow,
                high: savedHigh,
                conflictStartedAt: startedAt,
              })
            );
          }
        } else {
          window.localStorage.removeItem(conflictStorageKey);
        }
      } catch (e) {
        console.error("[GroupRatings] Failed to parse conflict from storage:", e);
        window.localStorage.removeItem(conflictStorageKey);
      }
    }
  }, [conflictStorageKey]);


  const clearConflictState = () => {
    window.localStorage.removeItem(conflictStorageKey);
    setIsConflict(false);
    setDataConflict(undefined);
    setConflictLow(0);
    setConflictHigh(-1);
    setConflictStartedAt(null);
  };

  const rollbackPendingRating = async () => {
    const tok = tokenLoader();
    const startedAt = conflictStartedAt;
    if (!startedAt) {
      console.error("[rollbackPendingRating] Missing conflictStartedAt");
      return false;
    }

    try {
      const res = await fetch(BaseURL + "rate/rollback-pending", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + tok,
        },
        body: JSON.stringify({
          group_number: parseInt(params.groupId, 10),
          conflict_started_at: startedAt,
        }),
      });

      if (!res.ok) {
        let errorText = "Could not discard rating";
        try {
          const errorData = await res.json();
          errorText = errorData.msg || errorText;
        } catch (_) {}
        throw new Error(errorText);
      }

      await res.json();
      clearConflictState();
      return true;
    } catch (error) {
      console.error("[rollbackPendingRating] Error:", error);
      return false;
    }
  };

  const allowConflictNavigation = () => {
    suppressNavigationGuardRef.current = true;
  };

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isConflict &&
      !suppressNavigationGuardRef.current &&
      currentLocation.pathname !== nextLocation.pathname
  );

  useEffect(() => {
    if (blocker.state !== "blocked") return;

    const ok = window.confirm(PAIRWISE_LEAVE_MSG);
    if (!ok) {
      blocker.reset();
      return;
    }

    (async () => {
      const success = await rollbackPendingRating();
      if (!success) {
        window.alert("Could not discard rating. Please try again.");
        blocker.reset();
        return;
      }
      suppressNavigationGuardRef.current = true;
      blocker.proceed();
    })();
  }, [blocker]);

  useEffect(() => {
    if (!isConflict) return undefined;

    const onBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = true;
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isConflict]);


  useEffect(() => {
    const getGroupData = async () => {
      const token1 = tokenLoader();

      const groupNum = params.groupId;
      let groupResData;
      const classCode = params.classCode;
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
                // body: JSON.stringify({ group_number: groupNumInt }),
      );

      if (groupRes.status === 422 || groupRes.status === 401) {
        return groupRes;
      }
      if (!groupRes.ok) {
        throw json(
          { message: "Could not authenticate user." },
          { status: 500 }
        );
      }
      groupResData = await groupRes.json();
      const d = groupResData.data;
      setGroupData(d);
      setBtsEnabled(
        d && typeof d.bts_enabled === "boolean" ? d.bts_enabled : true
      );
    };
    getGroupData();
  }, [params.groupId, params.classCode]);


  const isConflicToggle = (toggle) => {
    console.log("[isConflicToggle] toggle =", toggle);
    setIsConflict(toggle);

    if (!toggle) {
      clearConflictState();
      setTimeout(() => navigate("/"), 500);
    }
  };


  const handleBoundsChange = (newLow, newHigh) => {
    setConflictLow(newLow);
    setConflictHigh(newHigh);
  };


  const groupDataHandler = (rating, crowdRatings, feedback1) => {
    setGroupRatingsData(rating);
    setCrowdRatingsData(crowdRatings);
    setFeedback1Data(feedback1);
  };


  const otherQuestionsHandler = (questionNumber, rating) => {
    let otherQuestionsTemp = otherQuestionsData;
    otherQuestionsTemp[questionNumber] = rating;
    setOtherQuestionsData({ ...otherQuestionsTemp });
  };

  const normalizeExtraAnswer = (value) => {
    if (value === undefined || value === null || value === "") return null;
    const num = Number(value);
    if (
      !Number.isFinite(num) ||
      num < 1 ||
      num > 5 ||
      num !== Math.floor(num)
    ) {
      return null;
    }
    return num;
  };

  const validateExtraQuestions = () => {
    const questions = groupData?.questions;
    if (!questions || typeof questions !== "object") return true;

    const questionKeys = Object.keys(questions);
    if (questionKeys.length === 0) return true;

    for (const questionNum of questionKeys) {
      if (normalizeExtraAnswer(otherQuestionsData[questionNum]) === null) {
        setModalToggle(true);
        setModalText("Please answer all additional questions.");
        return false;
      }
    }
    return true;
  };


  const validateGroupRating = () => {
    if (!btsEnabled) {
      return true;
    }
    if (!crowdRatingsData) {
      setModalToggle(true);
      setModalText(
        "Please complete the BTS question (percentages must sum to 100)."
      );
      return false;
    }
    const totalRating = Object.values(crowdRatingsData).reduce(
      (acc, curr) => acc + curr,
      0
    );
    if (totalRating === 0) {
      setModalToggle(true);
      setModalText(
        "Please complete the BTS question (percentages must sum to 100)."
      );
      return false;
    }
    if (totalRating === 100) return true;
    else if (totalRating > 100) {
      //TODO: CREATE POPUP FOR RATING FAIL
      setModalToggle(true);
      setModalText("Your numbers sum up is over 100. Please fix.");
      return false;
    } else {
      setModalToggle(true);
      setModalText("Your numbers don't sum up to 100. Please fix.");
      return false;
    }
  };
  const validateGroupRanking = () => {
    if (!groupRatingsData) {
      setModalToggle(true);
      setModalText("Please rate the group");
      return false;
    }
    return true;
  };

  const validateGroup = () => {
    if (
      validateGroupRating() &&
      validateGroupRanking() &&
      validateExtraQuestions()
    ) {
      submitHandler();
    }
  };
  const submitHandler = async () => {
    setIsConflict(false);
    const tok = tokenLoader();
    const ratingBody = {
      data: {
        group_number: parseInt(params.groupId),
        rate: groupRatingsData,
        feedback12: feedback1,
        crowd_ratings: btsEnabled ? crowdRatingsData : {},
        answer: otherQuestionsData,
      },
    };
    console.log("[submitHandler] ratingBody:", ratingBody);

    try {
          // TODO: save base url in constants and import
      let res = await fetch(BaseURL + "rate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + tok,
        },
        body: JSON.stringify(ratingBody),
      });
      if (res.status === 422 || res.status === 401) {
        console.error("[submitHandler] Auth error:", res.status);
        return res;
      }
      if (!res.ok) {
        throw json({ message: "Could not authenticate user." }, { status: 500 });
      }
      const resData = await res.json();
      console.log("[submitHandler] Response:", resData);
      if (!resData.ranking) {
        console.log("[submitHandler] No conflicts, redirecting home");
        window.localStorage.removeItem(conflictStorageKey);
        return navigate("/");
      }
      let conflictData = resData.conflicts;
      console.log("[submitHandler] Conflicts detected:", conflictData);
      if (Array.isArray(conflictData) && conflictData.length > 0) {
        const startedAt = new Date().toISOString();
        setIsConflict(true);
        setDataConflict(conflictData);
        setConflictLow(0);
        setConflictHigh(conflictData.length - 1);
        setConflictStartedAt(startedAt);
        const payload = {
          groups: conflictData,
          low: 0,
          high: conflictData.length - 1,
          conflictStartedAt: startedAt,
        };
        window.localStorage.setItem(conflictStorageKey, JSON.stringify(payload));
      } else {
        window.localStorage.removeItem(conflictStorageKey);
        return navigate("/");
      }
    } catch (error) {
      console.error("[submitHandler] Error:", error);
      setModalToggle(true);
      setModalText(`Error: ${error.message}`);
    }
  };
  return (
    <Warpper>
      {modalToggle && <BasicModal text={modalText} close={setModalToggle} />}
      {isConflict && (
        <ConflictMessage
          groups={dataConflict}
          currentGroup={params.groupId}
          currentClassCode={params.classCode}
          groupRatingsData={groupRatingsData}
          isConflicToggle={isConflicToggle}
          groupName={groupData?.group_name}
          conflictStorageKey={conflictStorageKey}
          initialLow={conflictLow}
          initialHigh={conflictHigh}
          conflictStartedAt={conflictStartedAt}
          onBoundsChange={handleBoundsChange}
          allowConflictNavigation={allowConflictNavigation}
        />
      )}
      {!isConflict && (
        <>
          <GroupName>
            Team {params?.groupId}: {groupData?.group_name}
          </GroupName>
          <QesCard
            userEvaluation={true}
            question={"How do you think others will evaluate?"}
            rankHandler={groupDataHandler}
            otherRatings={true}
            btsBlockVisible={btsEnabled}
          />
          {groupData?.questions &&
            Object.keys(groupData?.questions).map((questionNum) => {
              return (
                <ExtraQus
                  key={questionNum}
                  questionNum={questionNum}
                  question={groupData.questions[questionNum]}
                  rankHandler2={otherQuestionsHandler}
                />
              );
            })}
          <ButtonContainer>
            <BackButton>
              <input
                onClick={() => validateGroup()}
                type="submit"
                value="Submit"
              />
            </BackButton>
            <BackButton>
              <Link to="..">Back</Link>
            </BackButton>
          </ButtonContainer>
        </>
      )}
    </Warpper>
  );
};

export default GroupRatings;