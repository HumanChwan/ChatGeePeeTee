import React from "react";
import Modal from "./Modal";

interface ICreateDMModal {
    isOpen: boolean;
    setIdx: (x: number) => void;
}

const CreateDMModal: React.FunctionComponent<ICreateDMModal> = ({ isOpen, setIdx }) => {
    return (
        <Modal
            isOpen={isOpen}
            setIsOpen={(x) => {
                if (!x) setIdx(-1);
            }}
        >
            <div></div>
        </Modal>
    );
};

export default CreateDMModal;
