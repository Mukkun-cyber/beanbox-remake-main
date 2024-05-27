import React from "react";
import "../styles/NotFound.css";
import forbiddenImage from "../assets/403 Forbidden.png";

export default function Forbidden() {
    return (
        <div className="error-page">
            <img src={forbiddenImage} alt="Forbidden access" />
            <a href="/">Go back to Home</a>
        </div>
    );
}
