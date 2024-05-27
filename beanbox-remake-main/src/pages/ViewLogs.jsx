import { React, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import supabase from "../utils/supabase";
import useCheckIfStaff from "../hooks/useCheckIfStaff";
import {
    Box,
    Button,
    FormControl,
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

export default function ViewLogs() {
    //MARK: INIT
    const initialData = {
        log_id: "",
        log_created_at: "",
        log_title: "",
        log_description: "",
        log_user: "",
    };
    const [currentData, setCurrentData] = useState(initialData);
    const [search, setSearch] = useState("");
    const [dataList, setDataList] = useState([]);
    const [refreshDataList, setRefreshDataList] = useState(false);
    const [filterSearch, setFilterSearch] = useState("");
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
            .order("log_id", { ascending: false });

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

    const handleFilterSearchChange = (event) => {
        setFilterSearch(event.target.value);
    };

    //MARK: FRONT
    return (
        <div className="page">
            <Sidebar />
            <div className="page-content">
                <h1>View Logs</h1>

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
                            <MenuItem value={"Created_at"}>Created_at</MenuItem>
                            <MenuItem value={"Title"}>Title</MenuItem>
                            <MenuItem value={"Description"}>
                                Description
                            </MenuItem>
                            <MenuItem value={"User"}>User</MenuItem>
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

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Created_at</TableCell>
                                <TableCell>Title</TableCell>
                                <TableCell
                                    sx={{
                                        width: "40%",
                                        overflowWrap: "anywhere",
                                        whiteSpace: "normal",
                                    }}
                                >
                                    Description
                                </TableCell>
                                <TableCell>User</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {dataList
                                .filter((data) => {
                                    if (!search) return true;
                                    if (!filterSearch) {
                                        return (
                                            (data.log_id &&
                                                String(data.log_id).includes(
                                                    search
                                                )) ||
                                            (data.log_created_at &&
                                                data.log_created_at.includes(
                                                    search
                                                )) ||
                                            (data.log_title &&
                                                data.log_title.includes(
                                                    search
                                                )) ||
                                            (data.log_description &&
                                                data.log_description.includes(
                                                    search
                                                )) ||
                                            (data.log_user &&
                                                data.log_user.includes(search))
                                        );
                                    }
                                    if (filterSearch === "ID")
                                        return (
                                            data.log_id &&
                                            String(data.log_id).includes(search)
                                        );
                                    if (filterSearch === "Created_at")
                                        return (
                                            data.log_created_at &&
                                            data.log_created_at.includes(search)
                                        );
                                    if (filterSearch === "Title")
                                        return (
                                            data.log_title &&
                                            data.log_title.includes(search)
                                        );
                                    if (filterSearch === "Description")
                                        return (
                                            data.log_description &&
                                            data.log_description.includes(
                                                search
                                            )
                                        );
                                    if (filterSearch === "User")
                                        return (
                                            data.log_user &&
                                            data.log_user.includes(search)
                                        );
                                    return false;
                                })
                                .map((data, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{data.log_id}</TableCell>
                                        <TableCell>
                                            {new Date(
                                                data.log_created_at
                                            ).toLocaleString()}
                                        </TableCell>
                                        <TableCell>{data.log_title}</TableCell>
                                        <TableCell
                                            sx={{
                                                width: "40%",
                                                overflowWrap: "anywhere",
                                                whiteSpace: "normal",
                                            }}
                                        >
                                            {data.log_description}
                                        </TableCell>
                                        <TableCell>{data.log_user_id}</TableCell>
                                    </TableRow>
                                ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>
        </div>
    );
}
