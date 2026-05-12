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
  btsBlockVisible = true,
}) => {
  const [userRating, setUserRatings] = useState();
  const [feedback1, setUserfeedback] = useState('');
  const [crowdRating, setCrowdRatings] = useState(null);

  useEffect(() => {
    rankHandler(userRating, crowdRating, feedback1);
  }, [userRating, crowdRating, feedback1]);

  const ratingHandler = (e) => {
    setUserRatings(parseInt(e.target.value));
  };
  const feedbackHandler = (e) => {
    setUserfeedback(e.target.value);
  };

  const crowdGroupRatingHandler = (e) => {
    const value = parseInt(e.target.value);
    const id = e.target.id;
    setCrowdRatings((prev) => {
      const base =
        prev ||
        {
          outstanding: 0,
          very_good: 0,
          good: 0,
          fair: 0,
          needs_improvement: 0,
        };
      return {
        ...base,
        [id]: isNaN(value) ? 0 : value,
      };
    });
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
              value={feedback1}
              id="feedback1"
              name="postContent"
              rows="4"
              style={{ width: "100%", textAlign: "left" }}
              placeholder="Questions to the project team"
              onChange={(e) => feedbackHandler(e)}
            ></textarea>
          )}
        </UserRatingsWarrper>
      )}
      {otherRatings && btsBlockVisible && (
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
                value={crowdRating?.outstanding ?? 0}
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
                value={crowdRating?.very_good ?? 0}
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
                value={crowdRating?.good ?? 0}
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
                value={crowdRating?.fair ?? 0}
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
                value={crowdRating?.needs_improvement ?? 0}
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