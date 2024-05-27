import React from "react";
import "../styles/Sidebar.css";
import { NavLink } from "react-router-dom";
import { BarChart, DocumentScanner, Fastfood, Home, Info, Inventory, Logout, MenuBook, People, PointOfSale } from "@mui/icons-material";
import supabase from "../utils/supabase";

export default function Sidebar() {

    const userRole = localStorage.getItem('user_role');

    const addLog = async (log_title, log_description) => {
        const { error } = await supabase
            .from("log")
            .insert([{ log_title, log_description, log_user_id: localStorage.getItem('user_id')}]);

        if (error) {
            console.error("Error adding log: ", error);
        }
    };

    const handleLogout = () => {

        addLog("AUTH", "LOG-OUT");

        localStorage.removeItem('user_id');
        localStorage.removeItem('user_role');
    };

    return (
        <div className="sidebar-container">
            <div className="sidebar">
                <h1>BeanBox</h1>
                <div className="sidebar-items">

                    <SidebarLink to="/dashboard" Icon={BarChart} label="Dashboard" />
                    {userRole === 'Admin' && (
                        <>
                            <SidebarLink to="/scanrfid" Icon={DocumentScanner} label="Scan RFID" />
                            <SidebarLink to="/managerfid" Icon={Home} label="Manage RFID" />
                            <SidebarLink to="/managestocks" Icon={Inventory} label="Manage Stocks" />
                            <SidebarLink to="/manageproducts" Icon={Fastfood} label="Manage Products" />
                            <SidebarLink to="/managerecipes" Icon={MenuBook} label="Manage Recipes" />
                            <SidebarLink to="/manageusers" Icon={People} label="Manage Users" />
                            <SidebarLink to="/viewlogs" Icon={Info} label="View Logs" />
                        </>
                    )}
                    <SidebarLink to="/pos" Icon={PointOfSale} label="POS" />
                    <NavLink to="/" onClick={handleLogout}>
                        <div className="tilecontent">
                            <Logout />
                            <p>Logout</p>
                        </div>
                    </NavLink>
                </div>
            </div>
        </div>
    );
}

function SidebarLink({ to, label, Icon }) {
    return (
        <NavLink to={to}>
            <div className="tilecontent">
            <Icon />
                <p>{label}</p>
            </div>
        </NavLink>
    );
}
