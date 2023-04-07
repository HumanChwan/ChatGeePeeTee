import React from "react";
import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";

import defaultImage from "../assets/user.png";
import { useState } from "react";
import axios from "axios";
import { pushErrorNotification, pushSuccessNotification } from "../components/Notifications";

const Profile = () => {
    const { user, setUser } = useAuth()!;

    const [username, setUsername] = useState(user?.username);
    const [name, setName] = useState(user?.name);
    const [email, setEmail] = useState(user?.email);

    const [picture, setPicture] = useState(user?.picture || defaultImage);

    if (!user) return <Navigate to="/" replace />;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files?.length === 0) {
            setPicture(user.picture || defaultImage);
            return;
        }

        const file = e.target.files[0];
        if (!file.type.startsWith("image/")) {
            setPicture(user.picture || defaultImage);
            return;
        }

        // Uploading to the server!!
        const formData = new FormData();
        formData.append("profile_photo", file);

        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_SERVER_URL}/auth/update-profile-picture`,
                formData,
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
                    message: "Could not update!",
                });
                return;
            }

            setPicture(data.image);
            setUser({ ...user, picture: data.image });

            pushSuccessNotification({
                title: "Upload successful!",
                message: "Profile photo has been updated.",
            });
        } catch (err) {
            pushErrorNotification({
                title: "Error",
                message: "Could not reach server",
            });
            console.error(`[#] Could not reach to server!`);
            setPicture(user.picture || defaultImage);
        }
    };

    return (
        <main className="container profile">
            <div className="profile__photo">
                <form className="profile__photo_form">
                    <img src={picture} alt="profile" />
                    <label className="btn">
                        Update Photo
                        <input
                            type="file"
                            style={{ display: "none" }}
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </label>
                </form>
            </div>
            <form className="profile__details">
                <div className="profile__details__fields">
                    <div className="profile__details__field">
                        <input
                            type="text"
                            value={username}
                            name="username"
                            id="username"
                            onChange={(e) => {
                                setUsername(e.target.value);
                            }}
                            className="primary-input"
                        />
                        <label htmlFor="username">Username</label>
                    </div>
                    <div className="profile__details__field">
                        <input
                            type="text"
                            value={name}
                            name="name"
                            id="name"
                            onChange={(e) => {
                                setName(e.target.value);
                            }}
                            className="primary-input"
                        />
                        <label htmlFor="name">Name</label>
                    </div>
                    <div className="profile__details__field">
                        <input
                            type="email"
                            value={email}
                            name="email"
                            id="email"
                            onChange={(e) => {
                                setEmail(e.target.value);
                            }}
                            className="primary-input"
                        />
                        <label htmlFor="email">Email</label>
                    </div>
                </div>
                <input type="submit" className="btn" value="Update Profile" />
            </form>
        </main>
    );
};

export default Profile;