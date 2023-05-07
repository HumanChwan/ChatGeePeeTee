import React, { useState, useRef, useEffect } from "react";
import { Conversation } from "../pages/Dashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo, faPencil, faUsers } from "@fortawesome/free-solid-svg-icons";
import useDefaultImage from "../hooks/useDefaultImage";

interface IChatSettingsProps {
    conversation: Conversation;
    setOpen: (x: boolean) => void;
}

const ChatSettings: React.FunctionComponent<IChatSettingsProps> = ({ conversation, setOpen }) => {
    const [participants, setParticipants] = useState<boolean>(false);
    const [overviewPicHover, setOverviewPicHover] = useState<boolean>(false);
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
                        <div className="detail">
                            <div
                                style={{
                                    backgroundImage: `url(${conversation.picture || defaultImage})`,
                                }}
                                className="picture"
                                onMouseOver={() => setOverviewPicHover(true)}
                                onMouseOut={() => setOverviewPicHover(false)}
                            >
                                {overviewPicHover && (
                                    <div className="hover-screen">
                                        <FontAwesomeIcon icon={faPencil} />
                                    </div>
                                )}
                            </div>
                            <div className="name">{conversation.name}</div>
                        </div>
                        <label htmlFor="export-to-txt">
                            <span>Export chat to a Text file</span>
                            <button className="btn ett" id="export-to-txt">
                                Export to text
                            </button>
                        </label>
                        <label htmlFor="leave-group">
                            <span>Danger Zone</span>
                            <button className="btn leave-group" id="leave-group">
                                Leave Group
                            </button>
                        </label>
                    </>
                ) : (
                    <></>
                )}
            </div>
        </div>
    );
};

export default ChatSettings;
