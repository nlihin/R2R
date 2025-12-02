import React from "react";
import styled from "styled-components";

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 8px;
  padding: 30px;
  max-width: 600px;
  max-height: 70vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const ModalHeader = styled.h2`
  color: #333;
  margin-top: 0;
  margin-bottom: 20px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
`;

const ModalBody = styled.div`
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;

  p {
    margin: 12px 0;
    text-align: justify;
  }

  h3 {
    color: #333;
    margin-top: 15px;
    margin-bottom: 10px;
  }

  ul {
    margin: 10px 0;
    padding-left: 20px;
  }

  li {
    margin: 8px 0;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #eee;
`;

const CloseButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #0056b3;
  }
`;

const PrivacyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>Data Processing Agreement</ModalHeader>
        <ModalBody>
          <p>
            TEXT TEXT TEXT Lorem ipsum dolor sit amet consectetur adipisicing
            elit. Rem similique perspiciatis libero eius, officia repellendus
            laborum nulla blanditiis obcaecati! Ut odio iusto nisi aliquid.
            Culpa quo voluptatibus dicta ducimus officiis?
          </p>

          <h3>1. Introduction</h3>
          <p>
            TEXT TEXT TEXT Lorem ipsum dolor sit amet consectetur adipisicing
            elit. Rem similique perspiciatis libero eius, officia repellendus
            laborum nulla blanditiis obcaecati! Ut odio iusto nisi aliquid.
            Culpa quo voluptatibus dicta ducimus officiis?
          </p>

          <h3>2. Personal Data Collected</h3>
          <p>
            {" "}
            TEXT TEXT TEXT Lorem ipsum dolor sit amet consectetur adipisicing
            elit. Rem similique perspiciatis libero eius, officia repellendus
            laborum nulla blanditiis obcaecati! Ut odio iusto nisi aliquid.
            Culpa quo voluptatibus dicta ducimus officiis?
          </p>
          <ul>
            <li>Identification information (name, ID number, email address)</li>
            <li>Educational information (class code, assessment results)</li>
            <li>Technical information (IP address, login timestamps)</li>
            <li>Survey and feedback responses</li>
            <li>Performance analytics and behavioral data</li>
          </ul>

          <h3>3. Purposes of Processing</h3>
          <p>
            TEXT TEXT TEXT Lorem ipsum dolor sit amet consectetur adipisicing
            elit. Rem similique perspiciatis libero eius, officia repellendus
            laborum nulla blanditiis obcaecati! Ut odio iusto nisi aliquid.
            Culpa quo voluptatibus dicta ducimus officiis?
          </p>

          <h3>4. Data Security</h3>
          <p>
            TEXT TEXT TEXT Lorem ipsum dolor sit amet consectetur adipisicing
            elit. Rem similique perspiciatis libero eius, officia repellendus
            laborum nulla blanditiis obcaecati! Ut odio iusto nisi aliquid.
            Culpa quo voluptatibus dicta ducimus officiis? TEXT TEXT TEXT Lorem
            ipsum dolor sit amet consectetur adipisicing elit. Rem similique
            perspiciatis libero eius, officia repellendus laborum nulla
            blanditiis obcaecati! Ut odio iusto nisi aliquid. Culpa quo
            voluptatibus dicta ducimus officiis? TEXT TEXT TEXT Lorem ipsum
            dolor sit amet consectetur adipisicing elit. Rem similique
            perspiciatis libero eius, officia repellendus laborum nulla
            blanditiis obcaecati! Ut odio iusto nisi aliquid. Culpa quo
            voluptatibus dicta ducimus officiis? TEXT TEXT TEXT Lorem ipsum
            dolor sit amet consectetur adipisicing elit. Rem similique
            perspiciatis libero eius, officia repellendus laborum nulla
            blanditiis obcaecati! Ut odio iusto nisi aliquid. Culpa quo
            voluptatibus dicta ducimus officiis? TEXT TEXT TEXT Lorem ipsum
            dolor sit amet consectetur adipisicing elit. Rem similique
            perspiciatis libero eius, officia repellendus laborum nulla
            blanditiis obcaecati! Ut odio iusto nisi aliquid. Culpa quo
            voluptatibus dicta ducimus officiis? TEXT TEXT TEXT Lorem ipsum
            dolor sit amet consectetur adipisicing elit. Rem similique
            perspiciatis libero eius, officia repellendus laborum nulla
            blanditiis obcaecati! Ut odio iusto nisi aliquid. Culpa quo
            voluptatibus dicta ducimus officiis?
          </p>
        </ModalBody>
        <ModalFooter>
          <CloseButton onClick={onClose}>Close</CloseButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PrivacyModal;
