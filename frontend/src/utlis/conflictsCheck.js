export const ConflictMessageFunc = (groups, currentGroup, groupRatingsData) => {
  const indexs = [];
  groups.forEach((group, index) => {
    if (group[1] === groupRatingsData) {
      indexs.push(index);
    }
  });
  let firstTempGroups = groups.slice(0, indexs[0]);
  let secondTempGroups = groups.slice(indexs[0], indexs.length);
  let thirdTempGroups = groups.slice(indexs.length);
  let orderedConflictGroup = [];
  for (let i = 0; i < secondTempGroups.length; i++) {
    let answer = window.confirm(
      `group ${secondTempGroups[i][0]} or group ${currentGroup}?`
    );
    if (answer) {
      orderedConflictGroup.push(secondTempGroups[i]);
      if (i === secondTempGroups.length - 1)
        orderedConflictGroup.push([currentGroup, groupRatingsData]);
    } else {
      orderedConflictGroup.push([currentGroup, groupRatingsData]);
      orderedConflictGroup = [
        ...orderedConflictGroup,
        ...secondTempGroups.slice(i),
      ];
      break;
    }
  }
  firstTempGroups = [
    ...firstTempGroups,
    ...orderedConflictGroup,
    ...thirdTempGroups,
  ];
  return firstTempGroups;
};
