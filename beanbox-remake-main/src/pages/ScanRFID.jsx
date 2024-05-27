import { React, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import supabase from "../utils/supabase";
import "../styles/ScanRFID.css";
import useCheckIfStaff from '../hooks/useCheckIfStaff';
import {
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
} from "@mui/material";

export default function ScanRFID() {
    //MARK: INIT
    const [scannedRfid, setScannedRfid] = useState("");
    const [dataList, setDataList] = useState([]);
    const [user_id, setUser_id] = useState(localStorage.getItem("user_id"));
    const [refreshDataList, setRefreshDataList] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useCheckIfStaff();

    useEffect(() => {
        fetchData();
    }, [refreshDataList]);

    const fetchData = async () => {
        setIsLoading(true);
        await getLogList();
    };

    async function getLogList() {
        const { data, error } = await supabase
            .from("log")
            .select()
            .eq('log_title', 'SCANNED RFID')
            .order("log_created_at", { ascending: false })
            .limit(10);

        if (error) {
            console.error("Error: ", error);
            return;
        }

        if (data.length != 0) {
            setDataList(data);
        } else {
            //set blank
            setDataList([]);
        }

        setIsLoading(false);
    }

    const handleKeyDown = async (e) => {
        e.preventDefault;
        if (e.key === "Enter") {
            await handleAddData();
            setScannedRfid("");
        }
    };

    const addLog = async (log_title, log_description) => {
        const { error } = await supabase
            .from("log")
            .insert([{ log_title, log_description, log_user_id: user_id}]);

        if (error) {
            console.error("Error adding log: ", error);
        }
    };

    const handleAddData = async () => {
        const { data: rfidData, error: rfidError } = await supabase
        .from("rfid")
        .select("stock_id, rfid_quantity")
        .eq("rfid_id", scannedRfid)
        .single();

    if (rfidError) {
        console.error("Error: ", rfidError);
        return;
    }

    if (rfidData) {
        // If a matching record is found, add stock to the corresponding 'stock_id'
        const { data: stockData, error: stockError } = await supabase
            .from("stocks")
            .select("stock_quantity, stock_name")
            .eq("stock_id", rfidData.stock_id)
            .single();

        if (stockError) {
            console.error("Error: ", stockError);
            return;
        }

        const oldData = { ...stockData };
        const newQuantity = stockData.stock_quantity + rfidData.rfid_quantity;
        stockData.stock_quantity = newQuantity;

        const { error: updateError } = await supabase
            .from("stocks")
            .update({ stock_quantity: newQuantity })
            .eq("stock_id", rfidData.stock_id);

        if (updateError) {
            console.error("Update Error: ", updateError);
        } else {
            addLog(
                "SCANNED RFID",
                `${stockData.stock_name}: ${oldData.stock_quantity} → ${stockData.stock_quantity}`
            );

            setRefreshDataList(prevState => !prevState);
        }
    } else {
        console.log("No matching RFID found");
    }
    };

    //MARK: FRONT
    return (
        <div className="page">
            <Sidebar />
            <div className="page-content">
                <h1>Scan RFID</h1>

                <TextField
                    variant="outlined"
                    id="id"
                    label="Scan RFID"
                    value={scannedRfid}
                    onChange={(e) => setScannedRfid(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus // focus on the input field when the page loads
                    onBlur={(e) => e.target.focus()} // keep focus on the input field
                    InputLabelProps={{
                        shrink: true,
                    }}
                />

                <div className="title-with-loading">
                    <h2>Recently Added</h2>
                    {isLoading && <CircularProgress />}
                </div>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Description</TableCell>
                                <TableCell>DateTime</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {dataList.map((data, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        {data.log_description}
                                    </TableCell>
                                    <TableCell>
                                        {new Date(
                                            data.log_created_at
                                        ).toLocaleString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
}
