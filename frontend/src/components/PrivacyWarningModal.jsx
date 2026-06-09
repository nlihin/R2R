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

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 20px;
  border-bottom: 2px solid #007bff;
  padding-bottom: 10px;
`;

const ModalTitle = styled.h2`
  color: #333;
  margin: 0;
`;

const HeaderCloseButton = styled.button`
  background: none;
  border: none;
  color: #666;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0 4px;

  &:hover {
    color: #333;
  }
`;

const ModalBody = styled.div`
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;

  p {
    margin: 12px 0;
    text-align: justify;
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px solid #eee;
`;

const CloseButton = styled.button`
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background-color: #5a6268;
  }
`;

const PrimaryButton = styled.button`
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

const PrivacyWarningModal = ({ isOpen, onClose, onContinue }) => {
  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Data Processing Notice</ModalTitle>
          <HeaderCloseButton type="button" onClick={onClose} aria-label="Close">
            ×
          </HeaderCloseButton>
        </ModalHeader>
        <ModalBody>
          <p>
            You have chosen not to agree to the data processing policy. You can
            still continue with registration.
          </p>
        </ModalBody>
        <ModalFooter>
          <CloseButton type="button" onClick={onClose}>
            Close
          </CloseButton>
          <PrimaryButton type="button" onClick={onContinue}>
            Register
          </PrimaryButton>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PrivacyWarningModal;
