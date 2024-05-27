import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import "./App.css";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ScanRFID from "./pages/ScanRFID";
import ManageRFID from "./pages/ManageRFID";
import ManageStocks from "./pages/ManageStocks";
import ManageProducts from "./pages/ManageProducts";
import ManageUsers from "./pages/ManageUsers";
import ViewLogs from "./pages/ViewLogs";
import POS from "./pages/POS";
import NotFound from "./pages/NotFound";
import ManageRecipes from "./pages/ManageRecipes";
import Forbidden from "./pages/Forbidden";

export default function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/scanrfid" element={<ScanRFID />} />
                <Route path="/managerfid" element={<ManageRFID />} />
                <Route path="/managestocks" element={<ManageStocks />} />
                <Route path="/manageproducts" element={<ManageProducts />} />
                <Route path="/managerecipes" element={<ManageRecipes />} />
                <Route path="/manageusers" element={<ManageUsers />} />
                <Route path="/viewlogs" element={<ViewLogs />} />
                <Route path="/pos" element={<POS />} />

                <Route path="*" element={<NotFound />} />
                <Route path="/forbidden" element={<Forbidden />} />
            </Routes>
        </BrowserRouter>
    );
}
