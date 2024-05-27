import { React, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Login.css";
import supabase from "../utils/supabase";
import bcrypt from "bcryptjs";

import {
    Card,
    CardContent,
    IconButton,
    InputAdornment,
    TextField,
    Button,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function Login() {
    //MARK: INIT
    const initialData = {
        user_email: "",
        user_password: "",
    };
    const [currentData, setCurrentData] = useState(initialData);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const handleChange = (e) => {
        setCurrentData({
            ...currentData,
            [e.target.name || e.target.id]: e.target.value,
        });
    };

    useEffect(() => {
        const userId = localStorage.getItem('user_id');
        const userRole = localStorage.getItem('user_role');

        if (userId && userRole) {
            navigate("/dashboard");
        }
    }, [navigate]);

    const addLog = async (log_title, log_description, user_id) => {
        const { error } = await supabase
            .from("log")
            .insert([{ log_title, log_description, log_user_id: user_id}]);

        if (error) {
            console.error("Error adding log: ", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { user_email, user_password } = currentData;

        const { data: userData, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("user_email", user_email)
            .single();

        // Check if the user data exists
        if (!userData) {
            alert("No user with this email");
            return;
        }

        const isValidPassword = bcrypt.compareSync(
            user_password,
            userData.user_password
        );

        if (!isValidPassword) {
            alert("Invalid password");
            return;
        }

        // Check if the user account is disabled
        if (userData.user_disabled) {
            alert("This account is disabled");
            return;
        }

        localStorage.setItem('user_role', userData.user_role);
        localStorage.setItem('user_id', userData.user_id);

        addLog("AUTH", `LOG-IN`, userData.user_id);

        navigate("/dashboard");
    };

    //MARK: FRONT
    return (
        <div className="auth-page">
            <Card className="auth-card">
                <CardContent className="auth-card-content">
                    <h1>Login</h1>

                    <form onSubmit={handleSubmit}>
                        <TextField
                            id="user_email"
                            label="Email"
                            value={currentData.user_email}
                            onChange={handleChange}
                            variant="outlined"
                        />

                        <TextField
                            id="user_password"
                            label="Password"
                            type={showPassword ? "text" : "password"}
                            value={currentData.user_password}
                            onChange={handleChange}
                            variant="outlined"
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                        >
                                            {showPassword ? (
                                                <VisibilityOff />
                                            ) : (
                                                <Visibility />
                                            )}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Button variant="contained" type="submit">
                            SIGN IN
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
