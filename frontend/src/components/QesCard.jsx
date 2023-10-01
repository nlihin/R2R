import { useEffect, useState } from "react";

import {
  UserEvaluationTitle,
  UserRatingsContainer,
  UserRatingsWarrper,
} from "./QesCardStyles";
import classes from "./QesCard.module.css";

const QesCard = ({
  userEvaluation,
  questionNum,
  question,
  rankHandler,
  otherRatings,
}) => {
  const [userRating, setUserRatings] = useState();

  const [crowdRating, setCrowdRatings] = useState({
    outstanding: 0,
    very_good: 0,
    good: 0,
    fair: 0,
    needs_improvement: 0,
  });
  useEffect(() => {
    rankHandler(userRating, crowdRating);
  }, [userRating, userRating, crowdRating]);

  const ratingHandler = (e) => {
    setUserRatings(parseInt(e.target.value));
  };

  const crowdGroupRatingHandler = (e) => {
    let tempCrowdRatings = { ...crowdRating };
    tempCrowdRatings[`${e.target.id}`] = parseInt(e.target.value);

    // let sumRatings = 0;

    // for (let key in tempCrowdRatings) {
    //   if (tempCrowdRatings.hasOwnProperty(key)) {
    //     sumRatings += tempCrowdRatings[key];
    //   }
    // }
    // console.log(sumRatings);
    // if (sumRatings > 100) {
    //   alert("split 100% currectly");
    //   return;
    // }
    setCrowdRatings(tempCrowdRatings);
  };
  return (
    <>
      {userEvaluation && (
        <UserRatingsWarrper>
          <UserEvaluationTitle>Your overall evaluation:</UserEvaluationTitle>
          <UserRatingsContainer>
            <div>
              <input
                id="rating1"
                type="radio"
                name="userRating"
                value="1"
                checked={userRating === 1}
                onChange={(e) => ratingHandler(e)}
              />
              <label
                htmlFor="rating1"
                style={{ backgroundColor: "#FF0000" }}
                className={userRating === 1 ? "chosen" : ""}
              >
                Needs Improvement
              </label>
            </div>
            <div>
              <input
                id="rating2"
                type="radio"
                name="userRating"
                value="2"
                checked={userRating === 2}
                onChange={(e) => ratingHandler(e)}
              />
              <label
                htmlFor="rating2"
                style={{ backgroundColor: "#FF5733" }}
                className={userRating === 2 ? "chosen" : ""}
              >
                Fair
              </label>
            </div>
            <div>
              <input
                id="rating3"
                type="radio"
                name="userRating"
                value="3"
                checked={userRating === 3}
                onChange={(e) => ratingHandler(e)}
              />
              <label
                htmlFor="rating3"
                style={{ backgroundColor: "#FFC300" }}
                className={userRating === 3 ? "chosen" : ""}
              >
                Good
              </label>
            </div>
            <div>
              <input
                id="rating4"
                type="radio"
                name="userRating"
                value="4"
                checked={userRating === 4}
                onChange={(e) => ratingHandler(e)}
              />
              <label
                htmlFor="rating4"
                style={{ backgroundColor: "rgb(170, 217, 150)" }}
                className={userRating === 4 ? "chosen" : ""}
              >
                Very Good
              </label>
            </div>
            <div>
              <input
                id="rating5"
                type="radio"
                name="userRating"
                value="5"
                checked={userRating === 5}
                onChange={(e) => ratingHandler(e)}
              />
              <label
                htmlFor="rating5"
                style={{ backgroundColor: "#1ead1e" }}
                className={userRating === 5 ? "chosen" : ""}
              >
                Outstanding
              </label>
            </div>
          </UserRatingsContainer>
          {otherRatings && (
            <textarea
              rows="4"
              style={{ width: "100%", textAlign: "left" }}
              placeholder="Your feedback"
            ></textarea>
          )}
        </UserRatingsWarrper>
      )}
      {otherRatings && (
        <div className={classes.crowdRating}>
          <UserEvaluationTitle>{question}</UserEvaluationTitle>
          <div>
            <div>
              {/* <label htmlFor="Outstanding">מצוין</label> */}
              <label
                htmlFor="Outstanding"
                style={{ backgroundColor: "#1ead1e" }}
              >
                Outstanding
              </label>
              <input
                id="outstanding"
                type="number"
                name="crowdRating"
                max="100"
                value={crowdRating.outstanding}
                checked={userRating === 5}
                onChange={(e) => crowdGroupRatingHandler(e)}
              />
            </div>
            <div>
              {/* <label htmlFor="VeryGood">טוב מאוד</label> */}
              <label htmlFor="VeryGood" style={{ backgroundColor: "#D1FFBD" }}>
                Very Good
              </label>
              <input
                id="very_good"
                type="number"
                name="crowdRating"
                max="100"
                value={crowdRating.very_good}
                checked={userRating === 4}
                onChange={(e) => crowdGroupRatingHandler(e)}
              />
            </div>
            <div>
              {/* <label htmlFor="Good">טוב</label> */}
              <label htmlFor="Good" style={{ backgroundColor: "#FFC300" }}>
                Good
              </label>
              <input
                id="good"
                type="number"
                name="crowdRating"
                max="100"
                value={crowdRating.good}
                checked={userRating === 3}
                onChange={(e) => crowdGroupRatingHandler(e)}
              />
            </div>
            <div>
              {/* <label htmlFor="Fair">לא טוב</label> */}
              <label htmlFor="Fair" style={{ backgroundColor: "#FF5733" }}>
                Fair
              </label>
              <input
                id="fair"
                type="number"
                name="crowdRating"
                max="100"
                value={crowdRating.fair}
                checked={userRating === 2}
                onChange={(e) => crowdGroupRatingHandler(e)}
              />
            </div>
            <div>
              {/* <label htmlFor="NeedsImprovement">טעון שיפור</label> */}
              <label
                htmlFor="NeedsImprovement"
                style={{ backgroundColor: "#FF0000" }}
              >
                Needs Improvement
              </label>
              <input
                id="needs_improvement"
                type="number"
                name="crowdRating"
                max="100"
                value={crowdRating.needs_improvement}
                checked={userRating === 1}
                onChange={(e) => crowdGroupRatingHandler(e)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QesCard;
