import React, { useState } from "react";
import Modal from "./Modal";
import axios from "axios";
import { pushErrorNotification } from "./Notifications";
import { Conversation } from "../pages/Dashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faXmark } from "@fortawesome/free-solid-svg-icons";

interface ICreateDMModal {
    isOpen: boolean;
    setIdx: (x: number) => void;
    setConversation: (x: Conversation[] | ((x: Conversation[]) => Conversation[])) => void;
}

interface AddableMember {
    username: string;
    admin: boolean;
}

const CreateGroupModal: React.FunctionComponent<ICreateDMModal> = ({
    isOpen,
    setIdx,
    setConversation,
}) => {
    const [groupName, setGroupName] = useState<string>("");
    const [username, setUsername] = useState<string>("");
    const [members, setMembers] = useState<AddableMember[]>([]);
    const [validUsername, setValidUsername] = useState<boolean>(false);

    const handleSubmit = async () => {
        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_SERVER_URL}/chat/create-group`,
                {
                    members,
                },
                { withCredentials: true }
            );

            if (!data || !data.success) {
                pushErrorNotification({
                    title: "Error",
                    message: "Could not create new Group!",
                });
                return;
            }

            setConversation((conversations) => [data.chat, ...conversations]);

            setIdx(-1);
        } catch (err) {
            console.error(err);
            pushErrorNotification({
                title: "Error",
                message: "Could not create new Group!",
            });
        } finally {
            setUsername("");
            setGroupName("");
        }
    };

    const checkUsername = async (possibleUsername: string) => {
        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_SERVER_URL}/auth/check-username`,
                {
                    username: possibleUsername,
                }
            );

            if (!data) {
                pushErrorNotification({
                    title: "Internal Server Error",
                    message: "",
                });
                setValidUsername(false);
                return;
            }

            setValidUsername(!data.success);
        } catch (err) {
            console.error(`[#] Error: ${err}`);
            setValidUsername(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            setIsOpen={(x) => {
                if (!x) setIdx(-1);
            }}
        >
            <div className="modal-form">
                <div className="modal-form-field">
                    <input
                        type="text"
                        value={groupName}
                        onChange={(e) => {
                            setGroupName(e.target.value);
                        }}
                        id="group-name-field"
                        name="group-name-field"
                        className="primary-input"
                    />
                    <label htmlFor="group-name-field">Group Name</label>
                </div>
                <form
                    className="modal-form-horizontal"
                    onSubmit={(e) => {
                        e.preventDefault();

                        if (!validUsername) {
                            pushErrorNotification({
                                title: "Invalid username",
                                message: "User with that uesrname doesn't exist",
                            });
                            return;
                        }

                        setMembers((members) => {
                            return [...members, { username, admin: false }];
                        });
                        setUsername("");
                    }}
                >
                    <div className="modal-form-field">
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                checkUsername(e.target.value);
                            }}
                            id="username-field"
                            name="username-field"
                            className="primary-input"
                        />
                        {username && (
                            <FontAwesomeIcon
                                icon={validUsername ? faCheck : faXmark}
                                title={validUsername ? "Valid User" : "Invalid user"}
                                style={{
                                    color: `${validUsername ? "#799964" : "#ff4d4d"}`,
                                }}
                            />
                        )}
                        <label htmlFor="username-field">Username</label>
                    </div>
                    <input type="submit" value="Add User" className="btn right-btn" />
                </form>
                <input
                    type="submit"
                    value="Creat Group"
                    className="btn right-btn"
                    onClick={handleSubmit}
                />
            </div>
        </Modal>
    );
};

export default CreateGroupModal;
