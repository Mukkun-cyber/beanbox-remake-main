import { React, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import supabase from "../utils/supabase";
import useCheckIfStaff from "../hooks/useCheckIfStaff";
import {
    Box,
    Button,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Modal,
    Select,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";

export default function ManageRFID() {
    //MARK: INIT
    const initialData = {
        rfid_id: "",
        stock_id: "",
        rfid_quantity: "",
        rfid_disabled: false,
    };
    const [currentData, setCurrentData] = useState(initialData);
    const [dataList, setDataList] = useState([]);
    const [refreshDataList, setRefreshDataList] = useState(false);
    const [user_id, setUser_id] = useState(localStorage.getItem("user_id"));
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filterSearch, setFilterSearch] = useState("");

    const [modalState, setModalState] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    //MARK: HOOKS
    useCheckIfStaff();

    const openModal = (dataTile, isEdit = false) => {
        setCurrentData(dataTile);
        setIsEditMode(isEdit);
        setModalState(true);
    };
    const closeModal = () => {
        setModalState(false);
    };

    const handleChange = (e) => {
        setCurrentData({
            ...currentData,
            [e.target.name || e.target.id]: e.target.value,
        });
    };

    const handleSwitch = (e) => {
        setCurrentData({
            ...currentData,
            [e.target.name]: e.target.checked,
        });
    };

    useEffect(() => {
        fetchData();
    }, [refreshDataList]);

    const fetchData = async () => {
        setIsLoading(true);
        await getRfidList();
    };

    async function getRfidList() {
        const { data: rfidData, error: rfidError } = await supabase
            .from("rfid")
            .select();

        if (rfidError) {
            console.error("Error: ", rfidError);
            setIsLoading(false);
            return;
        }

        const stockIds = rfidData.map((rfid) => rfid.stock_id);
        const { data: stockData, error: stockError } = await supabase
            .from("stocks")
            .select("stock_id, stock_name")
            .in("stock_id", stockIds);

        if (stockError) {
            console.error("Error fetching stock data: ", stockError);
            setIsLoading(false);
            return;
        }

        const mergedData = rfidData.map((rfid) => {
            const stock = stockData.find(
                (stock) => stock.stock_id === rfid.stock_id
            );
            return {
                ...rfid,
                stock_name: stock ? stock.stock_name : "Unknown",
            };
        });

        setDataList(mergedData);
        setIsLoading(false);
    }

    const addLog = async (log_title, log_description) => {
        const { error } = await supabase
            .from("log")
            .insert([{ log_title, log_description, log_user_id: user_id }]);

        if (error) {
            console.error("Error adding log: ", error);
        }
    };

    const handleAddData = async (event) => {
        event.preventDefault();
        const { data, error } = await supabase
            .from("rfid")
            .insert([currentData])
            .select();
        if (error) {
            console.error("Error adding data: ", error);
        } else {
            // Add this line to fetch the stock name
            const { data: stockData, error: stockError } = await supabase
                .from("stocks")
                .select("stock_name")
                .eq("stock_id", currentData.stock_id)
                .single();
            if (stockError) {
                console.error("Error fetching stock name: ", stockError);
            } else {
                // Add this line to add a log
                addLog("RFID ADDED", `${JSON.stringify(data[0])}`);
            }
            setRefreshDataList(!refreshDataList);
            closeModal();
        }
    };

    const handleUpdateData = async (event) => {
        event.preventDefault();
        // Fetch the current state of the RFID
        const { data: oldData, error: fetchError } = await supabase
            .from("rfid")
            .select("*")
            .eq("rfid_id", currentData.rfid_id)
            .single();

        if (fetchError) {
            console.error("Error fetching data: ", fetchError);
            return;
        }

        // Update the RFID
        const { error: updateError } = await supabase
            .from("rfid")
            .update(currentData)
            .match({ rfid_id: currentData.rfid_id });

        if (updateError) {
            console.error("Error updating data: ", updateError);
        } else {
            // Add a log
            addLog(
                "RFID UPDATED",
                `Old Data: ${JSON.stringify(
                    oldData
                )}, New Data: ${JSON.stringify(currentData)}`
            );

            setRefreshDataList(!refreshDataList);
            closeModal();
        }
    };

    const handleDeleteData = async (id) => {
        if (window.confirm("Are you sure you want to delete this item?")) {
            // Fetch the current state of the RFID
            const { data: oldData, error: fetchError } = await supabase
                .from("rfid")
                .select("*")
                .eq("rfid_id", id)
                .single();

            if (fetchError) {
                console.error("Error fetching data: ", fetchError);
                return;
            }

            // Delete the RFID
            const { error: deleteError } = await supabase
                .from("rfid")
                .delete()
                .match({ rfid_id: id });

            if (deleteError) {
                console.error("Error deleting data: ", deleteError);
            } else {
                // Add a log
                addLog("RFID DELETED", `Id: ${oldData.rfid_id}`);

                setRefreshDataList(!refreshDataList);
            }
        }
    };

    const handleFilterSearchChange = (event) => {
        setFilterSearch(event.target.value);
    };

    //MARK: FRONT
    return (
        <div className="page">
            <Sidebar />
            <div className="page-content">
                <h1>Manage RFID</h1>

                <div className="column-gap">
                    <div className="search-filter">
                        <FormControl sx={{ minWidth: 160 }}>
                            <InputLabel>Filter</InputLabel>
                            <Select
                                value={filterSearch}
                                label="Filter"
                                onChange={handleFilterSearchChange}
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                <MenuItem value={"ID"}>ID</MenuItem>
                                <MenuItem value={"Stock ID"}>Stock ID</MenuItem>
                                <MenuItem value={"Stock Name"}>
                                    Stock Name
                                </MenuItem>
                                <MenuItem value={"Quantity"}>Quantity</MenuItem>
                                <MenuItem value={"Disabled"}>Disabled</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            variant="outlined"
                            id="id"
                            label="Search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            sx={{ flexGrow: 1 }}
                        />
                    </div>
                    <Button
                        className="tablebutton"
                        variant="contained"
                        onClick={() => openModal(initialData, false)}
                    >
                        ADD RFID
                    </Button>
                </div>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Stock ID</TableCell>
                                <TableCell>Stock Name</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Disabled</TableCell>
                                <TableCell>Edit</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {dataList
                                .filter((data) => {
                                    if (!search) return true;
                                    if (!filterSearch) {
                                        return (
                                            (data.rfid_id &&
                                                String(data.rfid_id).includes(
                                                    search
                                                )) ||
                                            (data.stock_id &&
                                                String(data.stock_id).includes(
                                                    search
                                                )) ||
                                            (data.stock_name &&
                                                String(
                                                    data.stock_name
                                                ).includes(search)) ||
                                            (data.rfid_quantity &&
                                                String(
                                                    data.rfid_quantity
                                                ).includes(search)) ||
                                            (data.rfid_disabled &&
                                                String(
                                                    data.rfid_disabled
                                                ).includes(search))
                                        );
                                    }
                                    if (filterSearch === "ID")
                                        return (
                                            data.rfid_id &&
                                            String(data.rfid_id).includes(
                                                search
                                            )
                                        );
                                    if (filterSearch === "Stock ID")
                                        return (
                                            data.stock_id &&
                                            String(data.stock_id).includes(
                                                search
                                            )
                                        );
                                    if (filterSearch === "Stock Name")
                                        return (
                                            data.stock_name &&
                                            String(data.stock_name).includes(
                                                search
                                            )
                                        );
                                    if (filterSearch === "Quantity")
                                        return (
                                            data.rfid_quantity &&
                                            String(data.rfid_quantity).includes(
                                                search
                                            )
                                        );
                                    if (filterSearch === "Disabled")
                                        return (
                                            data.rfid_disabled &&
                                            String(data.rfid_disabled).includes(
                                                search
                                            )
                                        );
                                    return false;
                                })
                                .map((data, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{data.rfid_id}</TableCell>
                                        <TableCell>{data.stock_id}</TableCell>
                                        <TableCell>{data.stock_name}</TableCell>

                                        <TableCell>
                                            {data.rfid_quantity}
                                        </TableCell>
                                        <TableCell>
                                            {data.rfid_disabled ? "Yes" : "No"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="buttongroup">
                                                <IconButton
                                                    onClick={() =>
                                                        openModal(data, true)
                                                    }
                                                >
                                                    <Edit className="actionicon" />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() =>
                                                        handleDeleteData(
                                                            data.rfid_id
                                                        )
                                                    }
                                                >
                                                    <Delete className="actionicon" />
                                                </IconButton>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* //MARK: MODAL */}
                <Modal open={modalState} onClose={closeModal}>
                    <Box className="modal">
                        {currentData && (
                            <form
                                className="modalform"
                                onSubmit={
                                    isEditMode
                                        ? handleUpdateData
                                        : handleAddData
                                }
                            >
                                <TextField
                                    variant="outlined"
                                    id="rfid_id"
                                    required
                                    label="RFID Id"
                                    value={currentData.rfid_id}
                                    onChange={handleChange}
                                    disabled={isEditMode}
                                    type="number"
                                    inputProps={{ className: "hide-arrows" }}
                                />

                                <TextField
                                    variant="outlined"
                                    id="stock_id"
                                    required
                                    label="Stock Id"
                                    value={currentData.stock_id}
                                    onChange={handleChange}
                                    type="number"
                                    inputProps={{ className: "hide-arrows" }}
                                />

                                <TextField
                                    variant="outlined"
                                    id="rfid_quantity"
                                    required
                                    label="RFID Quantity"
                                    value={currentData.rfid_quantity}
                                    onChange={handleChange}
                                    type="number"
                                    inputProps={{ className: "hide-arrows" }}
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={currentData.rfid_disabled}
                                            onChange={handleSwitch}
                                            name="rfid_disabled"
                                            inputProps={{
                                                "aria-label": "Disabled toggle",
                                            }}
                                        />
                                    }
                                    label="Disabled"
                                />

                                <Button
                                    className="tablebutton"
                                    variant="contained"
                                    type="submit"
                                >
                                    {isEditMode ? "UPDATE" : "ADD"}
                                </Button>
                            </form>
                        )}
                    </Box>
                </Modal>
            </div>
        </div>
    );
}
