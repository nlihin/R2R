import styled from "styled-components";
export const ExtraQusWarrper = styled.div`
  textarea {
    margin-top: 15px;
  }
  @media (max-width: 740px) {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    > h3 {
      margin-bottom: 15px;
    }
    > textarea {
      max-width: 50%;
      margin: 0;
      margin-left: 20px;
    }
  }
`;

export const ExtraQusTitle = styled.h3`
  color: #000;
  @media (max-width: 740px) {
    width: 100%;
  }
`;

export const ExtraInputsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  flex-direction: row-reverse;
  justify-content: center;

  > div {
    display: flex;
    justify-content: center;
    align-items: center;
    width: calc(20% - 4px);
    width: auto;
    max-width: 25%;
    padding: 0 2px;

    input {
      display: none;
    }

    label {
      display: flex;
      align-items: center;
      justify-content: center;
      color: #000;
      width: 100%;
      height: 100%;
      position: relative;
      padding: 5px;
    }
    label.inputsExtraChosen {
      color: #fff;
      border: 2px solid red;
    }
    label.inputsExtraChosen:after {
      content: "";
      position: absolute;
      width: 100%;
      height: 100%;
    }
    label.inputsExtraChosen:hover:after,
    label.inputsExtraChosen:active:after,
    label.inputsExtraChosen:focus:after,
    label.inputsExtraChosen:after {
      border: 2px solid rgb(20, 124, 194);
    }
  }
  @media (min-width: 1024px) {
    div {
      min-width: 110px;
    }
  }

  @media (max-width: 740px) {
    flex-direction: column-reverse;
    width: 35%;
    > div {
      width: 100%;
      max-width: 100%;
      margin-bottom: 5px;
      height: 50px;
    }
    label {
      font-size: 14px;
      height: 100%;
    }
  }
`;
