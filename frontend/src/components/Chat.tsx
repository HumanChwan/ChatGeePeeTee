import React, { useRef, useState, useEffect } from "react";
import { Conversation } from "../pages/Dashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFile, faPaperPlane, faPaperclip, faXmark } from "@fortawesome/free-solid-svg-icons";
import useDefaultImage from "../hooks/useDefaultImage";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import ChatSettings from "./ChatSettings";
import { pushErrorNotification } from "./Notifications";

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

    const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData();
        if (file) form.append("file", file);
        form.append("cid", conversation.id);
        form.append("content", messageContent);

        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_SERVER_URL}/chat/message`,
                form,
                {
                    withCredentials: true,
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                }
            );

            if (!data || !data.success) {
                pushErrorNotification({
                    title: "Error",
                    message: "Some thing didn't work out :(",
                });
                return;
            }

            console.log(data.userMessage);
        } catch (err) {
            console.error(err);
            pushErrorNotification({
                title: "Error",
                message: "Some thing didn't work out :(",
            });
        } finally {
            setMessageContent("");
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
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
            <div className="chat__messages">
                {conversation.messages.map((message) => {
                    return (
                        <div
                            className={`chat__messages__message ${
                                message.userId === user?.id ? "sent" : "received"
                            }`}
                        >
                            <div className="chat__messages__message__detail">
                                <div
                                    className="img"
                                    style={{
                                        backgroundImage: `url(${
                                            message.senderPicture || defaultImage
                                        })`,
                                    }}
                                ></div>
                            </div>
                            <div className="chat__messages__message__main">
                                <h2>{message.senderName}</h2>
                                <div className="chat__messages__message__main__content">
                                    {message.fileLink && (
                                        <div className="content-file">
                                            <FontAwesomeIcon icon={faFile} />
                                            <a href={message.fileLink}>{message.fileName}</a>
                                        </div>
                                    )}
                                    {message.content && (
                                        <p className="content-text">{message.content}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
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
