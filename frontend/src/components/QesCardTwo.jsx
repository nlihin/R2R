import { useEffect, useState } from "react";

// import {
//   UserEvaluationTitle2,
//   UserRatingsContainer2,
//   UserRatingsWarrper2,
// } from "./QesCard2Styles";

const QesCardTwo = ({ questionNum, question, rankHandler2 }) => {
  const [userRating, setUserRatings] = useState(3);

  useEffect(() => {
    rankHandler2(questionNum, userRating);
  }, [parseInt(userRating), questionNum]);

  const ratingHandler = (e) => {
    setUserRatings(parseInt(e.target.value));
    rankHandler2(questionNum, e.target.value);
  };
  return (
    <>
      {
        <div>
          <div>{question}:</div>
          <div>
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
          </div>
        </div>
      }
    </>
  );
};

export default QesCardTwo;
