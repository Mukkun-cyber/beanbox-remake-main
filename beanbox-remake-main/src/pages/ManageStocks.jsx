import { React, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import supabase from "../utils/supabase";
import useCheckIfStaff from "../hooks/useCheckIfStaff";
import {
    Box,
    Button,
    Divider,
    FormControl,
    IconButton,
    InputLabel,
    MenuItem,
    Modal,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
} from "@mui/material";
import { Delete, Edit } from "@mui/icons-material";

export default function ManageStocks() {
    //MARK: INIT
    const initialData = {
        stock_id: "",
        stock_name: "",
        stock_quantity: "",
        stock_minimum: "",
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

    const handleFilterSearchChange = (event) => {
        setFilterSearch(event.target.value);
    };

    useEffect(() => {
        fetchData();
    }, [refreshDataList]);

    const fetchData = async () => {
        setIsLoading(true);
        await getStockList();
    };

    async function getStockList() {
        const { data, error } = await supabase
            .from("stocks")
            .select()
            .order("stock_id", { ascending: true });

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
        const { stock_id, ...dataWithoutId } = currentData;

        const { data, error } = await supabase
            .from("stocks")
            .insert([dataWithoutId])
            .select();
        if (error) {
            console.error("Error adding data: ", error);
        } else {
            addLog("STOCK ADDED", `${JSON.stringify(data[0])}`);

            setRefreshDataList(!refreshDataList);
            closeModal();
        }
    };

    const handleUpdateData = async (event) => {
        event.preventDefault();
        // Fetch the current state of the stock
        const { data: oldData, error: fetchError } = await supabase
            .from("stocks")
            .select("*")
            .eq("stock_id", currentData.stock_id)
            .single();

        if (fetchError) {
            console.error("Error fetching data: ", fetchError);
            return;
        }

        // Update the stock
        const { error: updateError } = await supabase
            .from("stocks")
            .update(currentData)
            .match({ stock_id: currentData.stock_id });

        if (updateError) {
            console.error("Error updating data: ", updateError);
        } else {
            // Add a log
            addLog(
                "STOCK UPDATED",
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
                .from("stocks")
                .select("*")
                .eq("stock_id", id)
                .single();

            if (fetchError) {
                console.error("Error fetching data: ", fetchError);
                return;
            }

            // Delete the RFID
            const { error: deleteError } = await supabase
                .from("stocks")
                .delete()
                .match({ stock_id: id });

            if (deleteError) {
                console.error("Error deleting data: ", deleteError);
            } else {
                // Add a log
                addLog("STOCK DELETED", `Id: ${oldData.stock_id}`);

                setRefreshDataList(!refreshDataList);
            }
        }
    };

    //MARK: FRONT
    return (
        <div className="page">
            <Sidebar />
            <div className="page-content">
                <h1>Manage Stocks</h1>

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
                                <MenuItem value={"Name"}>Name</MenuItem>
                                <MenuItem value={"Quantity"}>Quantity</MenuItem>
                                <MenuItem value={"Minimum"}>Minimum</MenuItem>
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
                        ADD STOCK
                    </Button>
                </div>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Minimum</TableCell>
                                <TableCell>Edit</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {dataList
                                .filter((data) => {
                                    if (!search) return true;
                                    if (!filterSearch) {
                                        return (
                                            (data.stock_id &&
                                                String(data.stock_id).includes(
                                                    search
                                                )) ||
                                            (data.stock_name &&
                                                data.stock_name.includes(
                                                    search
                                                )) ||
                                            (data.stock_quantity &&
                                                String(
                                                    data.stock_quantity
                                                ).includes(search)) ||
                                            (data.stock_minimum &&
                                                String(
                                                    data.stock_minimum
                                                ).includes(search))
                                        );
                                    }
                                    if (filterSearch === "ID")
                                        return (
                                            data.stock_id &&
                                            String(data.stock_id).includes(
                                                search
                                            )
                                        );
                                    if (filterSearch === "Name")
                                        return (
                                            data.stock_name &&
                                            data.stock_name.includes(search)
                                        );
                                    if (filterSearch === "Quantity")
                                        return (
                                            data.stock_quantity &&
                                            String(
                                                data.stock_quantity
                                            ).includes(search)
                                        );
                                    if (filterSearch === "Minimum")
                                        return (
                                            data.stock_minimum &&
                                            String(data.stock_minimum).includes(
                                                search
                                            )
                                        );
                                    return false;
                                })
                                .map((data) => (
                                    <TableRow key={data.stock_id}>
                                        <TableCell>{data.stock_id}</TableCell>
                                        <TableCell>{data.stock_name}</TableCell>
                                        <TableCell>
                                            {data.stock_quantity}
                                        </TableCell>
                                        <TableCell>
                                            {data.stock_minimum}
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
                                                            data.stock_id
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
                                    id="stock_id"
                                    required={isEditMode}
                                    label="Id"
                                    value={currentData.stock_id}
                                    onChange={handleChange}
                                    disabled
                                    type="number"
                                    inputProps={{ className: "hide-arrows" }}
                                />

                                <TextField
                                    variant="outlined"
                                    id="stock_name"
                                    required
                                    label="Name"
                                    value={currentData.stock_name}
                                    onChange={handleChange}
                                />

                                <TextField
                                    variant="outlined"
                                    id="stock_quantity"
                                    required
                                    label="Quantity"
                                    value={currentData.stock_quantity}
                                    onChange={handleChange}
                                    type="number"
                                    inputProps={{ className: "hide-arrows" }}
                                />

                                <TextField
                                    variant="outlined"
                                    id="stock_minimum"
                                    required
                                    label="Minimum"
                                    value={currentData.stock_minimum}
                                    onChange={handleChange}
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
