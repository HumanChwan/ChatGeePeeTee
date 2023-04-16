import React, { useRef, useState, useEffect } from "react";
import { Conversation } from "../pages/Dashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faPaperPlane, faPaperclip, faXmark } from "@fortawesome/free-solid-svg-icons";
import useDefaultImage from "../hooks/useDefaultImage";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import ChatSettings from "./ChatSettings";

interface IChatProps {
    conversation: Conversation | null;
}

const Chat: React.FunctionComponent<IChatProps> = ({ conversation }) => {
    const { user } = useAuth()!;
    const defaultImage = useDefaultImage();
    const [messageContent, setMessageContent] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [online, setOnline] = useState<boolean>(false);

    const [openSettings, setOpenSettings] = useState<boolean>(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setOpenSettings(false);
        if (!conversation || !conversation.dm || !user) return;

        const otherUser = conversation.members.filter((member) => member.userId !== user.id);
        if (otherUser.length !== 1) return;

        axios
            .get(
                `${process.env.REACT_APP_SERVER_URL}/auth/get-user-status?uid=${encodeURIComponent(
                    otherUser[0].userId
                )}`
            )
            .then(({ data }) => {
                if (!data || !data.success) return;
                setOnline(data.online);
            });
    }, [user, conversation]);

    if (!conversation)
        return (
            <div className="chat__no-conversation">
                <div>CHAT GEE PEE TEE</div>
                <div>Click on a conversation on the left, to chat with your buddies.</div>
            </div>
        );

    const handleMessageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) {
            setFile(null);
            return;
        }

        setFile(e.target.files[0]);
    };

    const reduceFileName = (fileName: string): string => {
        if (fileName.length < 30) return fileName;
        return `${fileName.slice(0, 27)}...`;
    };

    return (
        <div className="chat">
            <div
                className="chat__top"
                onClick={() => {
                    if (!conversation.dm) setOpenSettings(true);
                }}
            >
                <div
                    className="chat__top__image"
                    style={{
                        backgroundImage: `url(${conversation.picture || defaultImage})`,
                    }}
                ></div>
                <div className="chat__top__name">{conversation.name}</div>
                {conversation.dm && (
                    <div
                        className={`chat__top__status ${online ? "green" : "red"}`}
                        title={online ? "Online" : "Offline"}
                    ></div>
                )}
                {!conversation.dm && openSettings && (
                    <ChatSettings conversation={conversation} setOpen={setOpenSettings} />
                )}
            </div>
            <div className="chat__messages"></div>
            <form className="chat__box" onSubmit={handleMessageSubmit}>
                {file && (
                    <div className="chat__box_file">
                        <FontAwesomeIcon icon={faFile} />
                        <span>{reduceFileName(file.name)}</span>
                        <FontAwesomeIcon
                            icon={faXmark}
                            className="cross"
                            onClick={() => {
                                setFile(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }}
                        />
                    </div>
                )}
                <label className="file-input">
                    <FontAwesomeIcon icon={faPaperclip} className="file" />
                    <input
                        type="file"
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                        ref={fileInputRef}
                    />
                </label>
                <input
                    type="text"
                    className="primary-input chat__box_input"
                    placeholder="Type a message..."
                    value={messageContent}
                    onChange={(e) => {
                        setMessageContent(e.target.value);
                    }}
                />
                <label className="send-input">
                    <FontAwesomeIcon icon={faPaperPlane} />
                    <input type="submit" style={{ display: "none" }} />
                </label>
            </form>
        </div>
    );
};

export default Chat;