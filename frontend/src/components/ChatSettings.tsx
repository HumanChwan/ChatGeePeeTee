import React, { useState, useRef, useEffect } from "react";
import { Conversation } from "../pages/Dashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faUsers } from "@fortawesome/free-solid-svg-icons";
import useDefaultImage from "../hooks/useDefaultImage";

interface IChatSettingsProps {
    conversation: Conversation;
    setOpen: (x: boolean) => void;
}

const ChatSettings: React.FunctionComponent<IChatSettingsProps> = ({ conversation, setOpen }) => {
    const [participants, setParticipants] = useState<boolean>(false);
    const divRef = useRef<HTMLDivElement>(null);

    const defaultImage = useDefaultImage();

    useEffect(() => {
        if (!divRef.current) return;

        divRef.current.focus();
    }, []);

    return (
        <div
            className="chat-settings"
            onClick={() => {
                setOpen(true);
            }}
            tabIndex={1}
            onBlur={() => setOpen(false)}
            ref={divRef}
        >
            <div className="chat-settings__menu">
                <div
                    className={`chat-settings__menu_opt ${participants ? "" : "active"}`}
                    onClick={() => {
                        setParticipants(false);
                    }}
                >
                    <FontAwesomeIcon icon={faCircleInfo} />
                    Overview
                </div>
                <div
                    className={`chat-settings__menu_opt ${participants ? "active" : ""}`}
                    onClick={() => {
                        setParticipants(true);
                    }}
                >
                    <FontAwesomeIcon icon={faUsers} />
                    Participants
                </div>
            </div>
            <div className={`chat-settings__general ${participants ? "participants" : "overview"}`}>
                {!participants ? (
                    <>
                        <div
                            style={{
                                backgroundImage: `url(${conversation.picture || defaultImage})`,
                            }}
                            className="picture"
                        ></div>
                        <div className="name">{conversation.name}</div>
                    </>
                ) : (
                    <></>
                )}
            </div>
        </div>
    );
};

export default ChatSettings;
