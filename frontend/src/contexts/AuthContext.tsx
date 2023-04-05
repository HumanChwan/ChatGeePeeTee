import { createContext, useContext, useState } from "react";

export type User = {
    id: string;
    username: string;
    email: string;
    name: string;
    createdAt: Date;
    picture: string;
    online: boolean;
};

interface IContext {
    user: User | null;
    setUser: (user: User) => void;
    loading: boolean;
    setLoading: (flag: boolean) => void;
}

const AuthContext = createContext<IContext | null>(null);

export const useAuth = () => {
    return useContext(AuthContext);
};

const AuthProvider = (props: any) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const value = {
        user,
        setUser,
        loading,
        setLoading,
    };

    return <AuthContext.Provider value={value}>{props.children}</AuthContext.Provider>;
};

export default AuthProvider;
