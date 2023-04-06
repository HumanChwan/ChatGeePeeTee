import { faEye } from "@fortawesome/free-regular-svg-icons";
import { faCircleNotch, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import axios from "axios";

import { FormEvent, useState } from "react";
import { pushErrorNotification, pushSuccessNotification } from "../components/Notifications";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router-dom";

const Login = () => {
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [showPassword, setShowPassword] = useState<boolean>(false);

    const { setPointerLoading: setLoading, pointerLoading: loading } = useAuth()!;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        setLoading(true);
        try {
            const { data } = await axios.post(`${process.env.REACT_APP_SERVER_URL}/login`, {
                data: {
                    username,
                    password,
                },
            });

            if (!data || !data.success) {
                pushErrorNotification({
                    title: "Login failed!",
                    message: "Incorrect Credentials!",
                });
            }

            pushSuccessNotification({ title: "Login Successful!", message: "" });
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

    return (
        <main className="container login">
            <form className="login__form" onSubmit={(e) => handleSubmit(e)}>
                <div className="login__form__input">
                    <input
                        id="login_username"
                        type="text"
                        name="login_username"
                        value={username}
                        onChange={(e) => {
                            setUsername(e.target.value);
                        }}
                        required
                        className="primary-input"
                    />
                    <label htmlFor="login_username">Username/Email</label>
                </div>
                <div className="login__form__input">
                    <FontAwesomeIcon
                        icon={showPassword ? faEyeSlash : faEye}
                        onClick={() => {
                            setShowPassword((s) => !s);
                        }}
                    />
                    <input
                        id="login_password"
                        type={!showPassword ? "password" : "text"}
                        name="login_password"
                        value={password}
                        required
                        onChange={(e) => {
                            setPassword(e.target.value);
                        }}
                        className="primary-input"
                    />
                    <label htmlFor="login_password">Password</label>
                </div>
                <div className="login__form__links">
                    <Link to="/signup">Don't have an account? Signup.</Link>
                    <Link to="/forgot-password">Forgot Password?</Link>
                </div>
                <input type="submit" value={!loading ? "Login" : ""} className="btn" />
                {loading && <FontAwesomeIcon icon={faCircleNotch} className="spinner" />}
            </form>
        </main>
    );
};

export default Login;
