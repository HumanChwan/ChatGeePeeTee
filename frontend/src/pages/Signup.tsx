import { faEye } from "@fortawesome/free-regular-svg-icons";
import { faCheck, faCircleNotch, faEyeSlash, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";

import { FormEvent, useState } from "react";
import { pushErrorNotification, pushSuccessNotification } from "../components/Notifications";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

const Signup = () => {
    const [username, setUsername] = useState<string>("");
    const [email, setEmail] = useState<string>("");
    const [name, setName] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [validUsername, setValidUsername] = useState<boolean>(false);

    const { setPointerLoading: setLoading, pointerLoading: loading } = useAuth()!;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setLoading(true);
        try {
            const { data } = await axios.post(`${process.env.REACT_APP_SERVER_URL}/signup`, {
                data: {
                    username,
                    password,
                    name,
                    email,
                },
            });

            if (!data || !data.success) {
                pushErrorNotification({
                    title: "Signup failed!",
                    message: "Username has been already used",
                });
            } else {
                pushSuccessNotification({ title: "Login Successful!", message: "" });
            }
        } catch (err) {
            console.error(`[#] Could not reach server!`);
            pushErrorNotification({
                title: "Error",
                message: "Incorrect Credentials or Could not reach server!",
            });
        } finally {
            setLoading(false);
        }
    };

    const checkUsername = async () => {
        try {
            const { data } = await axios.post(
                `${process.env.REACT_URL_SERVER_URL}/check-username`,
                {
                    data: { username },
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

            setValidUsername(data.success);
        } catch (err) {
            console.error(`[#] Error: ${err}`);
            setValidUsername(false);
        }
    };

    return (
        <main className="container signup">
            <form className="signup__form" onSubmit={(e) => handleSubmit(e)}>
                <div className="signup__form__input">
                    <input
                        id="signup_name"
                        type="text"
                        name="signup_name"
                        value={name}
                        required
                        onChange={(e) => {
                            setName(e.target.value);
                        }}
                        className="primary-input"
                    />
                    <label htmlFor="signup_name">Name</label>
                </div>
                <div className="signup__form__input">
                    <input
                        id="signup_username"
                        type="text"
                        name="signup_username"
                        value={username}
                        required
                        onChange={(e) => {
                            setUsername(e.target.value);
                            checkUsername();
                        }}
                        className="primary-input"
                    />
                    {username && (
                        <FontAwesomeIcon
                            icon={validUsername ? faCheck : faXmark}
                            title={
                                validUsername
                                    ? "Accepted Username"
                                    : "This username is not available"
                            }
                            style={{
                                color: `${validUsername ? "#92da62" : "#ff4d4d"}`,
                            }}
                        />
                    )}
                    <label htmlFor="signup_username">Username</label>
                </div>
                <div className="signup__form__input">
                    <input
                        id="signup_email"
                        type="email"
                        name="signup_email"
                        value={email}
                        required
                        onChange={(e) => {
                            setEmail(e.target.value);
                        }}
                        className="primary-input"
                    />
                    <label htmlFor="signup_email">Email</label>
                </div>
                <div className="signup__form__input">
                    <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                        onClick={() => {
                            setShowPassword((s) => !s);
                        }}
                    />
                    <input
                        id="signup_password"
                        type={!showPassword ? "password" : "text"}
                        name="signup_password"
                        value={password}
                        required
                        onChange={(e) => {
                            setPassword(e.target.value);
                        }}
                        className="primary-input"
                    />
                    <label htmlFor="signup_password">Password</label>
                </div>
                <div className="signup__form__links">
                    <Link to="/login">Already have an account? Login.</Link>
                </div>
                <input type="submit" value={!loading ? "Signup" : ""} className="btn" />
                {loading && <FontAwesomeIcon icon={faCircleNotch} className="spinner" />}
            </form>
        </main>
    );
};

export default Signup;
