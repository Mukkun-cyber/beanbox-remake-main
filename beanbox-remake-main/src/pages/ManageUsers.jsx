import { React, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import supabase from "../utils/supabase";
import useCheckIfStaff from "../hooks/useCheckIfStaff";
import bcrypt from "bcryptjs";
import {
    Box,
    Button,
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputAdornment,
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
import {
    Delete,
    Edit,
    LockReset,
    Visibility,
    VisibilityOff,
} from "@mui/icons-material";
import userCheckIfStaff from "../hooks/useCheckIfStaff";

export default function ManageUsers() {
    //MARK: INIT
    const initialData = {
        user_id: "",
        user_email: "",
        user_password: "",
        user_disabled: false,
        user_role: "",
    };
    const [currentData, setCurrentData] = useState(initialData);
    const [dataList, setDataList] = useState([]);
    const [stored_user_id, setStored_user_id] = useState(
        localStorage.getItem("user_id")
    );
    const [refreshDataList, setRefreshDataList] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filterSearch, setFilterSearch] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [modalState, setModalState] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isChangePasswordMode, setIsChangePasswordMode] = useState(false);

    userCheckIfStaff();

    const openModal = (dataTile, isEdit = false, isChangePassword = false) => {
        if (isChangePassword) {
            setCurrentData({ ...dataTile, user_password: "" });
        } else {
            setCurrentData(dataTile);
        }
        setIsEditMode(isEdit);
        setIsChangePasswordMode(isChangePassword);
        setModalState(true);
    };
    const closeModal = () => {
        setModalState(false);
        setShowPassword(false);
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
        await getUserList();
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    async function getUserList() {
        const { data, error } = await supabase.from("users").select();

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
            .insert([
                { log_title, log_description, log_user_id: stored_user_id },
            ]);
        if (error) {
            console.error("Error adding log: ", error);
        }
    };

    const handleAddData = async (event) => {
        event.preventDefault();
        const { user_id, user_password, ...dataWithoutId } = currentData;

        // Encrypt the password
        const salt = bcrypt.genSaltSync(10);
        const encryptedPassword = bcrypt.hashSync(user_password, salt);

        const dataToInsert = {
            ...dataWithoutId,
            user_password: encryptedPassword,
        };

        const { data, error } = await supabase
            .from("users")
            .insert([dataToInsert])
            .select();
        if (error) {
            console.error("Error adding data: ", error);
        } else {
            addLog("USER ADDED", `${JSON.stringify(data[0])}`);

            setRefreshDataList(!refreshDataList);
            closeModal();
        }
    };

    const handleUpdateData = async (event) => {
        event.preventDefault();
        const { data: oldData, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("user_id", currentData.user_id)
            .single();

        if (fetchError) {
            console.error("Error fetching data: ", fetchError);
            return;
        }

        const { error: updateError } = await supabase
            .from("users")
            .update(currentData)
            .match({ user_id: currentData.user_id });

        if (updateError) {
            console.error("Error updating data: ", updateError);
        } else {
            // Add a log
            addLog(
                "USER UPDATED",
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
            const { data: oldData, error: fetchError } = await supabase
                .from("users")
                .select("*")
                .eq("user_id", id)
                .single();

            if (fetchError) {
                console.error("Error fetching data: ", fetchError);
                return;
            }

            const { error: deleteError } = await supabase
                .from("users")
                .delete()
                .match({ user_id: id });

            if (deleteError) {
                console.error("Error deleting data: ", deleteError);
            } else {
                // Add a log
                addLog("USER DELETED", `Id: ${oldData.user_id}`);

                setRefreshDataList(!refreshDataList);
            }
        }
    };

    const handleChangePassword = async (event) => {
        event.preventDefault();
        const { user_id, user_password } = currentData;

        // Encrypt the password
        const salt = bcrypt.genSaltSync(10);
        const encryptedPassword = bcrypt.hashSync(user_password, salt);

        const { error } = await supabase
            .from("users")
            .update({ user_password: encryptedPassword })
            .match({ user_id });

        if (error) {
            console.error("Error changing password: ", error);
        } else {
            addLog("PASSWORD CHANGED", `User Id: ${user_id}`);

            setRefreshDataList(!refreshDataList);
            closeModal();
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
                <h1>Manage Users</h1>

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
                                <MenuItem value={"Email"}>Email</MenuItem>
                                <MenuItem value={"Disabled"}>Disabled</MenuItem>
                                <MenuItem value={"Role"}>Role</MenuItem>
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
                        ADD USER
                    </Button>
                </div>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Email</TableCell>
                                <TableCell>Disabled</TableCell>
                                <TableCell>Role</TableCell>
                                <TableCell>Edit</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {dataList
                                .filter((data) => {
                                    if (!search) return true;
                                    if (!filterSearch) {
                                        return (
                                            (data.user_id &&
                                                String(data.user_id).includes(
                                                    search
                                                )) ||
                                            (data.user_email &&
                                                String(
                                                    data.user_email
                                                ).includes(search)) ||
                                            (data.user_disabled &&
                                                String(
                                                    data.user_disabled
                                                ).includes(search)) ||
                                            (data.user_role &&
                                                String(data.user_role).includes(
                                                    search
                                                ))
                                        );
                                    }
                                    if (filterSearch === "ID")
                                        return (
                                            data.user_id &&
                                            String(data.user_id).includes(
                                                search
                                            )
                                        );
                                    if (filterSearch === "Email")
                                        return (
                                            data.user_email &&
                                            String(data.user_email).includes(
                                                search
                                            )
                                        );
                                    if (filterSearch === "Disabled")
                                        return (
                                            data.user_disabled &&
                                            String(data.user_disabled).includes(
                                                search
                                            )
                                        );
                                    if (filterSearch === "Role")
                                        return (
                                            data.user_role &&
                                            String(data.user_role).includes(
                                                search
                                            )
                                        );
                                    return false;
                                })
                                .map((data) => (
                                    <TableRow key={data.user_id}>
                                        <TableCell>{data.user_id}</TableCell>
                                        <TableCell>{data.user_email}</TableCell>
                                        <TableCell>
                                            {data.user_disabled ? "Yes" : "No"}
                                        </TableCell>
                                        <TableCell>{data.user_role}</TableCell>
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
                                                            data.user_id
                                                        )
                                                    }
                                                >
                                                    <Delete className="actionicon" />
                                                </IconButton>
                                                <IconButton
                                                    onClick={() =>
                                                        openModal(
                                                            data,
                                                            false,
                                                            true
                                                        )
                                                    }
                                                >
                                                    <LockReset className="actionicon" />
                                                </IconButton>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* //MARK: MODAL ADD EDIT*/}
                <Modal open={modalState} onClose={closeModal}>
                    <Box className="modal">
                        {currentData && (
                            <form
                                className="modalform"
                                onSubmit={
                                    isEditMode
                                        ? handleUpdateData
                                        : isChangePasswordMode
                                        ? handleChangePassword
                                        : handleAddData
                                }
                            >
                                <TextField
                                    variant="outlined"
                                    id="user_id"
                                    required={isEditMode}
                                    label="Id"
                                    value={currentData.user_id}
                                    onChange={handleChange}
                                    type="number"
                                    disabled
                                    inputProps={{ className: "hide-arrows" }}
                                />

                                <TextField
                                    variant="outlined"
                                    id="user_email"
                                    required
                                    label="Email"
                                    disabled={isChangePasswordMode}
                                    value={currentData.user_email}
                                    onChange={handleChange}
                                />

                                <TextField
                                    variant="outlined"
                                    id="user_password"
                                    required
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    disabled={
                                        isEditMode && !isChangePasswordMode
                                    }
                                    value={currentData.user_password}
                                    onChange={handleChange}
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    aria-label="toggle password visibility"
                                                    onClick={
                                                        handleTogglePasswordVisibility
                                                    }
                                                >
                                                    {showPassword ? (
                                                        <Visibility />
                                                    ) : (
                                                        <VisibilityOff />
                                                    )}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <FormControl sx={{ minWidth: 160 }}>
                                    <InputLabel>Role</InputLabel>
                                    <Select
                                        name="user_role"
                                        value={currentData.user_role}
                                        label="Role"
                                        onChange={handleChange}
                                        disabled={isChangePasswordMode}
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        <MenuItem value={"Staff"}>
                                            Staff
                                        </MenuItem>
                                        <MenuItem value={"Admin"}>
                                            Admin
                                        </MenuItem>
                                    </Select>
                                </FormControl>

                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={currentData.user_disabled}
                                            onChange={handleSwitch}
                                            name="user_disabled"
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
                                    {isEditMode
                                        ? "UPDATE"
                                        : isChangePasswordMode
                                        ? "CHANGE PASSWORD"
                                        : "ADD"}
                                </Button>
                            </form>
                        )}
                    </Box>
                </Modal>
            </div>
        </div>
    );
}
