import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import { List, Item } from "./HomeStyles";
import { tokenLoader } from "../utlis/auth";
import { json } from "react-router-dom";
import { BaseURL } from "../routes/url";

const getAvailGroups = async (token1) => {
  //const token1 = tokenLoader();
  // save base url in constants and import
  console.log(`getAvailGroups`);
  const res = await fetch(`${BaseURL}group`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: "Bearer " + token1,
    },
  });
  if (res.status === 422 || res.status === 401) {
    return res;
  }
  if (!res.ok) {
    throw json({ message: "Could not authenticate user." }, { status: 500 });
  }
  let resData = await res.json();
  return resData.data;
};

const getGroupData = async (groupNum, classCode, token1) => {
  //const token1 = tokenLoader();//moved outside
  console.log(`getGroupData`);
  let groupResDate;
  let groupRes = await fetch(
    `${BaseURL}/rate?group_number=${groupNum}&class_code=${classCode}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: "Bearer " + token1,
      },
    });
  if (groupRes.status === 422 || groupRes.status === 401) {
    return groupRes;
  }
  if (!groupRes.ok) {
    throw json({ message: "Could not authenticate user." }, { status: 500 });
  }
  groupResDate = await groupRes.json();
  return groupResDate.data;
};



const Home = () => {
  const [availGroups, setAvailGroups] = useState({});
  const [groups, setGroups] = useState({});
  const [displayedGroups, setDisplayedGroups] = useState([]);
  const [currentClassCode, setCurrentClassCode] = useState(null);

  useEffect(() => {
    console.log(`UpdataAvailGroupsData`);
    const updateAvailGroupsData = async () => {
      const token = tokenLoader();
      let availGroups = await getAvailGroups(token);
      setAvailGroups({ ...availGroups });
      const classCode = availGroups?.class_code;
      setCurrentClassCode(classCode);
    };
    updateAvailGroupsData();
  }, []);

  useEffect(() => {
    console.log(`updateGroupsData`);
    const updateGroupsData = async () => {
      console.log(Object.keys(availGroups));
      let groupNums = Object.keys(availGroups).filter(key => key !== 'class_code');
      console.log(`waiting`);
      const token = tokenLoader();
      for (let i = 0; i < groupNums.length; i++) {
        let groupNum = groupNums[i];
        let group = await getGroupData(groupNum, currentClassCode, token); //data for this specific num
        console.log(groupNum);

        let updatedGroup = { rated: availGroups[groupNum], ...group };

        // Update the state with the new group data
        setGroups((prevGroups) => ({ ...prevGroups, [groupNum]: updatedGroup }));

        // Update the displayed groups
        setDisplayedGroups((prevDisplayedGroups) => [...prevDisplayedGroups, groupNum]);
      }
    };
    console.log(`still waiting`);
    if (currentClassCode) {
      updateGroupsData();
    }
    console.log(`done waiting`);
  }, [availGroups, currentClassCode]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      <h2 style={{ color: "#000", marginBottom: "30px" }}>Today's Teams:</h2>
      <List>
        {Object.keys(groups)?.map((groupNum) => (
          <Item key={`${currentClassCode}:${groupNum}`}>
            <Card
              groupName={groups[groupNum]["group_name"]}
              GroupStatus={groups[groupNum]["rated"]}
              groupNum={groupNum}
              classCode={currentClassCode}
              // groupQuestions={groups.groupNum?.questions}
            />
          </Item>
        ))}
      </List>
    </div>
  );
};

export default Home;
