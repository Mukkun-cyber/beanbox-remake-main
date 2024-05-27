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

export default function ManageProducts() {
    //MARK: INIT
    const initialData = {
        product_id: "",
        product_name: "",
        product_price: "",
        product_disabled: false,
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
        await getProductList();
    };

    async function getProductList() {
        const { data, error } = await supabase
            .from("products")
            .select()
            .order("product_id", { ascending: true });

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

        const { product_id, ...dataWithoutId } = currentData;
        console.log(dataWithoutId);
        const { data, error } = await supabase
            .from("products")
            .insert([dataWithoutId])
            .select();
        if (error) {
            console.error("Error adding data: ", error);
        } else {
            addLog(`PRODUCT ADDED`, `${JSON.stringify(data[0])}`);

            setRefreshDataList(!refreshDataList);
            closeModal();
        }
    };

    const handleUpdateData = async (event) => {
        event.preventDefault();
        // Fetch the current state of the product
        const { data: oldData, error: fetchError } = await supabase
            .from("products")
            .select("*")
            .eq("product_id", currentData.product_id)
            .single();

        if (fetchError) {
            console.error("Error fetching data: ", fetchError);
            return;
        }

        // Update the product
        const { error: updateError } = await supabase
            .from("products")
            .update(currentData)
            .match({ product_id: currentData.product_id });

        if (updateError) {
            console.error("Error updating data: ", updateError);
        } else {
            // Add a log
            addLog(
                "PRODUCT UPDATED",
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
                .from("products")
                .select("*")
                .eq("product_id", id)
                .single();

            if (fetchError) {
                console.error("Error fetching data: ", fetchError);
                return;
            }

            // Delete the RFID
            const { error: deleteError } = await supabase
                .from("products")
                .delete()
                .match({ product_id: id });

            if (deleteError) {
                console.error("Error deleting data: ", deleteError);
            } else {
                // Add a log
                addLog("PRODUCT DELETED", `Id: ${oldData.product_id}`);

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
                <h1>Manage Products</h1>

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
                                <MenuItem value={"Price"}>Price</MenuItem>
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
                        ADD PRODUCT
                    </Button>
                </div>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Name</TableCell>
                                <TableCell>Price</TableCell>
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
                                            (data.product_id &&
                                                String(
                                                    data.product_id
                                                ).includes(search)) ||
                                            (data.product_name &&
                                                data.product_name.includes(
                                                    search
                                                )) ||
                                            (data.product_price &&
                                                String(
                                                    data.product_price
                                                ).includes(search)) ||
                                            (data.product_disabled &&
                                                String(
                                                    data.product_disabled
                                                ).includes(search))
                                        );
                                    }
                                    if (filterSearch === "ID")
                                        return (
                                            data.product_id &&
                                            String(data.product_id).includes(
                                                search
                                            )
                                        );
                                    if (filterSearch === "Name")
                                        return (
                                            data.product_name &&
                                            data.product_name.includes(search)
                                        );
                                    if (filterSearch === "Price")
                                        return (
                                            data.product_price &&
                                            String(data.product_price).includes(
                                                search
                                            )
                                        );
                                    if (filterSearch === "Disabled")
                                        return (
                                            data.product_disabled &&
                                            String(
                                                data.product_disabled
                                            ).includes(search)
                                        );
                                    return false;
                                })
                                .map((data) => (
                                    <TableRow key={data.product_id}>
                                        <TableCell>{data.product_id}</TableCell>
                                        <TableCell>
                                            {data.product_name}
                                        </TableCell>
                                        <TableCell>
                                            {data.product_price}
                                        </TableCell>
                                        <TableCell>
                                            {data.product_disabled
                                                ? "Yes"
                                                : "No"}
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
                                                            data.product_id
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
                                    id="product_id"
                                    required={isEditMode}
                                    label="Id"
                                    value={currentData.product_id}
                                    onChange={handleChange}
                                    disabled
                                    type="number"
                                    inputProps={{ className: "hide-arrows" }}
                                />

                                <TextField
                                    variant="outlined"
                                    id="product_name"
                                    required
                                    label="Name"
                                    value={currentData.product_name}
                                    onChange={handleChange}
                                />

                                <TextField
                                    variant="outlined"
                                    id="product_price"
                                    required
                                    label="Price"
                                    value={currentData.product_price}
                                    onChange={handleChange}
                                    type="number"
                                    inputProps={{ className: "hide-arrows" }}
                                />

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={
                                                currentData.product_disabled
                                            }
                                            onChange={handleSwitch}
                                            name="product_disabled"
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
