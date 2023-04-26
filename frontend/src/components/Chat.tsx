import React, { useRef, useState, useEffect } from "react";
import { Conversation } from "../pages/Dashboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowDown,
    faFile,
    faPaperPlane,
    faPaperclip,
    faXmark,
} from "@fortawesome/free-solid-svg-icons";
import useDefaultImage from "../hooks/useDefaultImage";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import ChatSettings from "./ChatSettings";
import { pushErrorNotification } from "./Notifications";
import AudioRecorder from "./AudioRecorder";

interface IChatProps {
    conversation: Conversation | null;
}

const Chat: React.FunctionComponent<IChatProps> = ({ conversation }) => {
    const { user } = useAuth()!;
    const [firstTime, setFirstTime] = useState<boolean>(true);
    const defaultImage = useDefaultImage();
    const [messageContent, setMessageContent] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [online, setOnline] = useState<boolean>(false);

    const [openSettings, setOpenSettings] = useState<boolean>(false);

    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesRef = useRef<HTMLDivElement>(null);
    const [goDown, setGoDown] = useState<boolean>(true);

    const handleScroll = (e: React.UIEvent<HTMLDivElement, UIEvent>) => {
        const result =
            e.currentTarget.scrollTop + e.currentTarget.clientHeight >=
            e.currentTarget.scrollHeight - 1;

        setGoDown(!result);
    };

    useEffect(() => {
        setOpenSettings(false);
        scrollToBottom();
        if (!conversation || !conversation.dm || !user) return;

        const otherUser = conversation.members.filter((member) => member.userId !== user.id);
        if (otherUser.length !== 1) return;

        axios
            .get(
                `${process.env.REACT_APP_SERVER_URL}/auth/get-user-status?uid=${encodeURIComponent(
                    otherUser[0].userId
                )}`,
                {
                    withCredentials: true,
                }
            )
            .then(({ data }) => {
                if (!data || !data.success) return;
                setOnline(data.online);
            });
    }, [user, conversation]);

    useEffect(() => {
        if (!conversation) return;

        if (!goDown) {
            scrollToBottom(firstTime ? "auto" : "smooth");
            setFirstTime(false);
        }
    }, [conversation, goDown, firstTime]);

    useEffect(() => {
        setFirstTime(true);
    }, [conversation?.id]);

    useEffect(() => {
        if (audioBlob) setFile(new File([audioBlob], `audio-recording-${new Date()}.webm`));
    }, [audioBlob]);

    const scrollToBottom = (motion: "auto" | "smooth" = "smooth") => {
        if (!messagesRef.current) return;

        messagesRef.current.scrollTo({
            top: messagesRef.current.scrollHeight,
            left: 0,
            behavior: motion,
        });
        setGoDown(false);
    };

    if (!conversation)
        return (
            <div className="chat__no-conversation">
                <div>CHAT GEE PEE TEE</div>
                <div>Click on a conversation on the left, to chat with your buddies.</div>
            </div>
        );

    const handleMessageSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        let someValue = !!messageContent || !!file;

        if (!someValue) return;

        const form = new FormData();
        form.append("cid", conversation.id);
        if (messageContent) form.append("content", messageContent);
        if (file) form.append("file", file);

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
            if (fileInputRef.current) fileInputRef.current.value = "";
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
            <div className="chat__messages" ref={messagesRef} onScroll={handleScroll}>
                {conversation.messages.map((message) => {
                    return (
                        <div
                            className={`chat__messages__message ${
                                message.userId === user?.id ? "sent" : "received"
                            }`}
                            key={message.id}
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
                                            <a
                                                href={message.fileLink}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                {message.fileName}
                                            </a>
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
                {goDown && (
                    <div className="chat__messages__go-down" onClick={() => scrollToBottom()}>
                        <FontAwesomeIcon icon={faArrowDown} />
                    </div>
                )}
            </div>
            <form className="chat__box" onSubmit={handleMessageSubmit}>
                {file && (
                    <div className="chat__box_file" title={file.name}>
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
                {!!messageContent || !!file ? (
                    <label className="send-input">
                        <FontAwesomeIcon icon={faPaperPlane} />
                        <input type="submit" style={{ display: "none" }} />
                    </label>
                ) : (
                    <AudioRecorder setAudioBlob={setAudioBlob} />
                )}
            </form>
        </div>
    );
};

export default Chat;
