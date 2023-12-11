import { useEffect, useState } from "react";
import {
  ExtraInputsContainer,
  ExtraQusTitle,
  ExtraQusWarrper,
} from "./ExtraQusStyles";

const ExtraQus = ({ questionNum, question, rankHandler2 }) => {
  const [userRating, setUserRatings] = useState(3);

  useEffect(() => {
    rankHandler2(questionNum, userRating);
  }, [userRating, questionNum]);

  const ratingHandler = (e) => {
    setUserRatings(parseInt(e.target.value));
    rankHandler2(questionNum, e.target.value);
  };

  const nameAttribute = `userRating${questionNum}`;
  const idAttribute1 = `1userRating${questionNum}`;
  const idAttribute2 = `2userRating${questionNum}`;
  const idAttribute3 = `3userRating${questionNum}`;
  const idAttribute4 = `4userRating${questionNum}`;
  const idAttribute5 = `5userRating${questionNum}`;
  return (
    <>
      <ExtraQusWarrper>
        <ExtraQusTitle>{question}:</ExtraQusTitle>
        <ExtraInputsContainer>
          <div>
            <input
              id={idAttribute1}
              type="radio"
              name={nameAttribute}
              value="1"
              checked={userRating === 1}
              onChange={(e) => ratingHandler(e)}
            />
            <label
              htmlFor={idAttribute1}
              style={{ backgroundColor: "#FF0000" }}
              className={userRating === 1 ? "inputsExtraChosen" : ""}
            >
              Needs Improvement
            </label>
          </div>
          <div>
            <input
              id={idAttribute2}
              type="radio"
              name={nameAttribute}
              value="2"
              checked={userRating === 2}
              onChange={(e) => ratingHandler(e)}
            />
            <label
              htmlFor={idAttribute2}
              style={{ backgroundColor: "#FF5733" }}
              className={userRating === 2 ? "inputsExtraChosen" : ""}
            >
              Fair
            </label>
          </div>
          <div>
            <input
              id={idAttribute3}
              type="radio"
              name={nameAttribute}
              value="3"
              checked={userRating === 3}
              onChange={(e) => ratingHandler(e)}
            />
            <label
              htmlFor={idAttribute3}
              style={{ backgroundColor: "#FFC300" }}
              className={userRating === 3 ? "inputsExtraChosen" : ""}
            >
              Good
            </label>
          </div>
          <div>
            <input
              id={idAttribute4}
              type="radio"
              name={nameAttribute}
              value="4"
              checked={userRating === 4}
              onChange={(e) => ratingHandler(e)}
            />
            <label
              htmlFor={idAttribute4}
              style={{ backgroundColor: "rgb(170, 217, 150)" }}
              className={userRating === 4 ? "inputsExtraChosen" : ""}
            >
              Very Good
            </label>
          </div>
          <div>
            <input
              id={idAttribute5}
              type="radio"
              name={nameAttribute}
              value="5"
              checked={userRating === 5}
              onChange={(e) => ratingHandler(e)}
            />
            <label
              htmlFor={idAttribute5}
              style={{ backgroundColor: "#1ead1e" }}
              className={userRating === 5 ? "inputsExtraChosen" : ""}
            >
              Outstanding
            </label>
          </div>
        </ExtraInputsContainer>
      </ExtraQusWarrper>
    </>
  );
};

export default ExtraQus;
