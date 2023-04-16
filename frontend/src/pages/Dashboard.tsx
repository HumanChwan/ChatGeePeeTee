import axios from "axios";
import { useState, useEffect } from "react";
import { pushErrorNotification } from "../components/Notifications";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faFile } from "@fortawesome/free-solid-svg-icons";
import NewChatOptions from "../components/NewChatOptions";
import { useAuth } from "../contexts/AuthContext";

import useDefaultImage from "../hooks/useDefaultImage";
import { Navigate, useNavigate } from "react-router-dom";
import Options from "../components/Options";
import LogoutPrompt from "../components/LogoutPrompt";
import Chat from "../components/Chat";

export interface Member {
    userId: string;
    username: string;
    picture: string | null;
    admin: boolean;
}

export interface Message {
    id: string;
    userId: string;
    senderName: string;
    senderPicture: string | null;
    removed: boolean;
    content: string | null;
    fileLink: string | null;
    fileName: string | undefined;
}

export interface Conversation {
    messages: Message[];
    members: Member[];
    id: string;
    dm: boolean;
    name: string | null;
    picture: string | null;
    lastMessage: Date;
    disappearingMode: Boolean;
}

const SETTINGS = ["Profile", "Logout"];
const Dashboard = () => {
    const defaultImage = useDefaultImage();
    const { user } = useAuth()!;
    const navigate = useNavigate();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConversationIdx, setSelectedConversationIdx] = useState<number | null>(null);
    const [selectedSettingIdx, setSelectedSettingIdx] = useState<number>(-1);

    const getAllConversations = async () => {
        try {
            const { data } = await axios.get(`${process.env.REACT_APP_SERVER_URL}/chat/get-chats`, {
                withCredentials: true,
            });

            if (!data || !data.success) {
                pushErrorNotification({
                    title: "Error",
                    message: "Could not fetch chats and messages from server!",
                });
                return;
            }

            const x = data.chats.map((chat: Conversation) => ({ ...chat, unread: false }));
            setConversations(x);
        } catch (err) {
            console.error(err);
            pushErrorNotification({
                title: "Error",
                message: "Could not fetch chats and messages from server!",
            });
        }
    };

    useEffect(() => {
        getAllConversations();
    }, []);

    useEffect(() => {
        if (selectedSettingIdx === -1) return;

        switch (selectedSettingIdx) {
            case 0:
                navigate("/profile");
                break;
            case 1:
                break;
            default:
                console.error("Weird stuff happened");
        }
    }, [selectedSettingIdx, navigate]);

    if (!user) return <Navigate to="/login" replace />;

    return (
        <main className="container dashboard">
            <section className="dashboard__panel">
                <div className="dashboard__panel__chat-options">
                    <h3>Chat Gee Pee Tee</h3>
                    <NewChatOptions setConversations={setConversations} />
                </div>
                <div className="dashboard__panel__conversations">
                    {conversations.map((conversation, idx) => {
                        const lastMessage =
                            conversation.messages.length > 0
                                ? conversation.messages[conversation.messages.length - 1]
                                : null;
                        return (
                            <div
                                key={conversation.id}
                                className={`conversation ${
                                    selectedConversationIdx === idx ? "active" : ""
                                }`}
                                onClick={() => {
                                    setSelectedConversationIdx(idx);
                                }}
                            >
                                <div
                                    className="conversation__image"
                                    style={{
                                        backgroundImage: `url(${
                                            conversation.picture || defaultImage
                                        })`,
                                    }}
                                ></div>
                                <div className="conversation__text">
                                    <h3>{conversation.name}</h3>
                                    {lastMessage && (
                                        <p>
                                            {lastMessage.senderName}:{" "}
                                            {lastMessage.content ? (
                                                lastMessage.content
                                            ) : (
                                                <>
                                                    <FontAwesomeIcon icon={faFile} />{" "}
                                                    {lastMessage.fileName}
                                                </>
                                            )}
                                        </p>
                                    )}
                                </div>
                                <div className="conversation__meta"></div>
                            </div>
                        );
                    })}
                </div>
                <div className="dashboard__panel__settings">
                    <div
                        className="img"
                        style={{ backgroundImage: `url(${user.picture || defaultImage})` }}
                    >
                        <FontAwesomeIcon icon={faCircle} style={{ color: "#53d05b" }} size="xs" />
                    </div>
                    <div className="username">{user.username}</div>
                    <div>
                        <Options
                            setOptionSelectedIdx={setSelectedSettingIdx}
                            options={SETTINGS.map((x) => ({ name: x }))}
                            vertical="top"
                            horizontal="right"
                            gear
                        />
                        <LogoutPrompt
                            isOpen={selectedSettingIdx === 1}
                            setIdx={setSelectedSettingIdx}
                        />
                    </div>
                </div>
            </section>
            <section className="dashboard__chat">
                <Chat
                    conversation={
                        selectedConversationIdx !== null
                            ? conversations[selectedConversationIdx]
                            : null
                    }
                />
            </section>
        </main>
    );
};

export default Dashboard;
