import React from "react";
import Modal from "./Modal";

interface ICreateGroupModal {
    isOpen: boolean;
    setIdx: (x: number) => void;
}

const CreateGroupModal: React.FunctionComponent<ICreateGroupModal> = ({ isOpen, setIdx }) => {
    return (
        <Modal
            isOpen={isOpen}
            setIsOpen={(x) => {
                if (!x) setIdx(-1);
            }}
        >
            <div>Hello World</div>
        </Modal>
    );
};

export default CreateGroupModal;
