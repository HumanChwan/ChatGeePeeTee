import axios from "axios";
import { useState, useEffect, useCallback } from "react";
import { pushErrorNotification } from "../components/Notifications";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircle, faFile } from "@fortawesome/free-solid-svg-icons";
import NewChatOptions from "../components/NewChatOptions";
import { useAuth } from "../contexts/AuthContext";

import defaultPicture from "../assets/user.png";
import { Navigate, useNavigate } from "react-router-dom";
import Options from "../components/Options";

interface Message {
    id: string;
    userId: string;
    senderName: string;
    senderPicture: string | null;

    content: string | null;
    fileLink: string | null;
    fileName: string | undefined;
}

interface Conversation {
    id: string; // Chat ID
    dm: boolean;
    name: string;
    picture: string;
    messages: Message[];
    unread: boolean;
}

const SETTINGS = ["Profile", "Logout"];
const Dashboard = () => {
    const { user, setUser } = useAuth()!;
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

            setConversations(data.chats.map((chat: Conversation) => ({ ...chat, unread: false })));
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

    const logout = useCallback(async () => {
        const { data } = await axios.get(`${process.env.REACT_APP_SERVER_URL}/auth/logout`, {
            withCredentials: true,
        });

        setUser(null);

        if (!data || !data.success) {
            pushErrorNotification({
                title: "Error",
                message: "Try refreshing the browser",
            });
        }
    }, [setUser]);

    useEffect(() => {
        if (selectedSettingIdx === -1) return;

        switch (selectedSettingIdx) {
            case 0:
                navigate("/profile");
                break;
            case 1:
                logout();
                break;
            default:
                console.error("Weird stuff happened");
        }
    }, [selectedSettingIdx, logout, navigate]);

    if (!user) return <Navigate to="/login" replace />;

    return (
        <main className="container dashboard">
            <section className="dashboard__panel">
                <div className="dashboard__panel__chat-options">
                    <h3>Chat Gee Pee Tee</h3>
                    <NewChatOptions />
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
                                className="conversation"
                                onClick={() => {
                                    setSelectedConversationIdx(idx);
                                }}
                            >
                                <div
                                    className="conversation__image"
                                    style={{ backgroundImage: `url(${conversation.picture})` }}
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
                        style={{ backgroundImage: `url(${user.picture || defaultPicture})` }}
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
                    </div>
                </div>
            </section>
            <section className="dashboard__chat"></section>
        </main>
    );
};

export default Dashboard;
