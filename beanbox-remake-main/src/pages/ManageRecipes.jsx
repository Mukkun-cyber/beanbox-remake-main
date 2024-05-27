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

export default function ManageRecipes() {
    //MARK: INIT
    const initialData = {
        recipe_id: "",
        product_id: "",
        stock_id: "",
        recipe_quantity: "",
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

    useEffect(() => {
        fetchData();
    }, [refreshDataList]);

    const fetchData = async () => {
        setIsLoading(true);
        await getRecipeList();
    };

    async function getRecipeList() {
        const { data: recipeData, error: recipeError } = await supabase
            .from("recipe")
            .select();

        if (recipeError) {
            console.error("Error: ", recipeError);
            return;
        }

        const productIds = recipeData.map((recipe) => recipe.product_id);
        const stockIds = recipeData.map((recipe) => recipe.stock_id);

        const { data: productData, error: productError } = await supabase
            .from("products")
            .select("product_id, product_name")
            .in("product_id", productIds);

        const { data: stockData, error: stockError } = await supabase
            .from("stocks")
            .select("stock_id, stock_name")
            .in("stock_id", stockIds);

        if (productError || stockError) {
            console.error(
                "Error fetching related data: ",
                productError || stockError
            );
            setIsLoading(false);
            return;
        }

        const mergedData = recipeData.map((recipe) => {
            const product = productData.find(
                (product) => product.product_id === recipe.product_id
            );
            const stock = stockData.find(
                (stock) => stock.stock_id === recipe.stock_id
            );
            return {
                ...recipe,
                product_name: product ? product.product_name : "Unknown",
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

        const { product_id, stock_id, recipe_quantity } = currentData;
        const recipe_id = `${product_id}${stock_id}`;
        const dataToInsert = {
            recipe_id,
            product_id,
            stock_id,
            recipe_quantity,
        };

        const { data, error } = await supabase
            .from("recipe")
            .insert([dataToInsert])
            .select();
        if (error) {
            console.error("Error adding data: ", error);
        } else {
            addLog(`RECIPE ADDED`, `${JSON.stringify(data[0])}`);

            setRefreshDataList(!refreshDataList);
            closeModal();
        }
    };

    const handleUpdateData = async (event) => {
        event.preventDefault();
        // Fetch the current state of the recipe
        const { data: oldData, error: fetchError } = await supabase
            .from("recipe")
            .select("*")
            .eq("recipe_id", currentData.recipe_id)
            .single();

        if (fetchError) {
            console.error("Error fetching data: ", fetchError);
            return;
        }

        // Update the recipe
        const { error: updateError } = await supabase
            .from("recipe")
            .update(currentData)
            .match({ recipe_id: currentData.recipe_id });

        if (updateError) {
            console.error("Error updating data: ", updateError);
        } else {
            // Add a log
            addLog(
                "RECIPE UPDATED",
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
            // Fetch the current state of the recipe
            const { data: oldData, error: fetchError } = await supabase
                .from("recipe")
                .select("*")
                .eq("recipe_id", id)
                .single();

            if (fetchError) {
                console.error("Error fetching data: ", fetchError);
                return;
            }

            // Delete the recipe
            const { error: deleteError } = await supabase
                .from("recipe")
                .delete()
                .match({ recipe_id: id });

            if (deleteError) {
                console.error("Error deleting data: ", deleteError);
            } else {
                // Add a log
                addLog("RECIPE DELETED", `Id: ${oldData.recipe_id}`);

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
                <h1>Manage Recipes</h1>

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
                                <MenuItem value={"Product ID"}>
                                    Product ID
                                </MenuItem>
                                <MenuItem value={"Product Name"}>
                                    Product Name
                                </MenuItem>
                                <MenuItem value={"Stock ID"}>Stock ID</MenuItem>
                                <MenuItem value={"Stock Name"}>
                                    Stock Name
                                </MenuItem>
                                <MenuItem value={"Quantity"}>Quantity</MenuItem>
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
                        ADD RECIPE
                    </Button>
                </div>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Product ID</TableCell>
                                <TableCell>Product Name</TableCell>
                                <TableCell>Stock ID</TableCell>
                                <TableCell>Stock Name</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Edit</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {dataList
                                .filter((data) => {
                                    if (!search) return true;
                                    if (!filterSearch) {
                                        return (
                                            (data.recipe_id &&
                                                String(data.recipe_id).includes(
                                                    search
                                                )) ||
                                            (data.product_id &&
                                                String(
                                                    data.product_id
                                                ).includes(search)) ||
                                            (data.product_name &&
                                                String(
                                                    data.product_name
                                                ).includes(search)) ||
                                            (data.stock_id &&
                                                String(data.stock_id).includes(
                                                    search
                                                )) ||
                                            (data.stock_name &&
                                                String(
                                                    data.stock_name
                                                ).includes(search)) ||
                                            (data.recipe_quantity &&
                                                String(
                                                    data.recipe_quantity
                                                ).includes(search))
                                        );
                                    }
                                    if (filterSearch === "Recipe ID")
                                        return (
                                            data.recipe_id &&
                                            String(data.recipe_id).includes(
                                                search
                                            )
                                        );
                                    if (filterSearch === "Product ID")
                                        return (
                                            data.product_id &&
                                            String(data.product_id).includes(
                                                search
                                            )
                                        );
                                    if (filterSearch === "Product Name")
                                        return (
                                            data.product_name &&
                                            String(data.product_name).includes(
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
                                            data.recipe_quantity &&
                                            String(
                                                data.recipe_quantity
                                            ).includes(search)
                                        );
                                    return false;
                                })
                                .map((data) => (
                                    <TableRow key={data.recipe_id}>
                                        <TableCell>{data.recipe_id}</TableCell>
                                        <TableCell>{data.product_id}</TableCell>
                                        <TableCell>
                                            {data.product_name}
                                        </TableCell>
                                        <TableCell>{data.stock_id}</TableCell>
                                        <TableCell>{data.stock_name}</TableCell>
                                        <TableCell>
                                            {data.recipe_quantity}
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
                                                            data.recipe_id
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
                                    id="recipe_id"
                                    required={isEditMode}
                                    label="Id"
                                    value={currentData.recipe_id}
                                    onChange={handleChange}
                                    disabled
                                    type="number"
                                    inputProps={{ className: "hide-arrows" }}
                                />

                                <TextField
                                    variant="outlined"
                                    id="product_id"
                                    required
                                    label="Product ID"
                                    disabled={isEditMode}
                                    type="number"
                                    value={currentData.product_id}
                                    onChange={handleChange}
                                    inputProps={{ className: "hide-arrows" }}
                                />

                                <TextField
                                    variant="outlined"
                                    id="stock_id"
                                    required
                                    label="Stock ID"
                                    type="number"
                                    disabled={isEditMode}
                                    value={currentData.stock_id}
                                    onChange={handleChange}
                                    inputProps={{ className: "hide-arrows" }}
                                />

                                <TextField
                                    variant="outlined"
                                    id="recipe_quantity"
                                    required
                                    label="Quantity"
                                    type="number"
                                    value={currentData.recipe_quantity}
                                    onChange={handleChange}
                                    inputProps={{ className: "hide-arrows" }}
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
