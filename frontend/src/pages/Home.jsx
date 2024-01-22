import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import { List, Item } from "./HomeStyles";
import { tokenLoader } from "../utlis/auth";
import { json } from "react-router-dom";
import { BaseURL } from "../routes/url";

const getAvailGroups = async () => {
  const token1 = tokenLoader();
   // save base url in constants and import
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

const getGroupData = async (groupNum) => {
  const token1 = tokenLoader();
  const classCode = localStorage.getItem("classCode");  // Retrieve class_code from local storage
  let groupResDate;
  let groupRes = await fetch(`${BaseURL}/rate?group_number=${groupNum}`, {
  //let groupRes = await fetch(`${BaseURL}/rate?group_number=${groupNum}&class_code=${classCode}`, {
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
  return groupResDate.data;
};

// const getAllGroupsData = async (groupsNums) => {
//   let groupsData = [];
//   for (let i = 0; i < groupsNums.length; i++) {
//     let groupNum = groupsNums[i];
//     let singGroupData = await getGroupData(groupNum);
//     singGroupData["groupNum"] = groupNum;
//     groupsData.push(singGroupData);
//   }
//   return groupsData;
// };

const Home = () => {
  const [availGroups, setAvailGroups] = useState({});
  const [groups, setGroups] = useState({});
  const [displayedGroups, setDisplayedGroups] = useState([]);//lihi

  useEffect(() => {
    const updateAvailGroupsData = async () => {
      let availGroups = await getAvailGroups();
      setAvailGroups({ ...availGroups });
    };
    updateAvailGroupsData();
  }, []);

   useEffect(() => {
    const updateGroupsData = async () => {
        console.log(Object.keys(availGroups));
        let groupNums = Object.keys(availGroups)
        console.log(`waiting`);

        for (let i = 0; i < groupNums.length; i++) {
            let groupNum = groupNums[i];
            let group = await getGroupData(groupNum); //data for this specific num
            console.log(groupNum);

            let updatedGroup = { rated: availGroups[groupNum], ...group };

            // Update the state with the new group data
            setGroups(prevGroups => ({ ...prevGroups, [groupNum]: updatedGroup }));

            // Update the displayed groups
            setDisplayedGroups((prevDisplayedGroups) => [...prevDisplayedGroups, groupNum]);
          }
    };
    console.log(`still waiting`);
    updateGroupsData();
    console.log(`done waiting`);
  }, [availGroups]);

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
          <Item key={groupNum}>
            <Card
              groupName={groups[groupNum]["group_name"]}
              GroupStatus={groups[groupNum]["rated"]}
              groupNum={groupNum}
              // groupQuestions={groups.groupNum?.questions}
            />
          </Item>
        ))}
      </List>
    </div>
  );
};

export default Home;
