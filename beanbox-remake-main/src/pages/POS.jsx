import { React, useState, useEffect } from "react";
import "../styles/POS.css";
import Sidebar from "../components/Sidebar";
import supabase from "../utils/supabase";
import {
    Box,
    Button,
    Card,
    CardActions,
    CardContent,
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
    Typography,
} from "@mui/material";
import {
    Add,
    Delete,
    Edit,
    Remove,
    ShoppingCartCheckout,
} from "@mui/icons-material";

export default function POS() {
    //MARK: INIT
    const [user_id, setUser_id] = useState(localStorage.getItem("user_id"));
    const [dataList, setDataList] = useState([]);
    const [refreshDataList, setRefreshDataList] = useState(false);
    const [quantities, setQuantities] = useState([]);
    const [currentData, setCurrentData] = useState(null);
    const [modalState, setModalState] = useState(false);
    const [totalOrder, setTotalOrder] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [dinePreference, setDinePreference] = useState("");
    const [antiSpam, setAntiSpam] = useState(false);

    const handleAdd = (index) => {
        const newQuantities = [...quantities];
        newQuantities[index]++;
        setQuantities(newQuantities);
    };

    const handleRemove = (index) => {
        if (quantities[index] > 0) {
            const newQuantities = [...quantities];
            newQuantities[index]--;
            setQuantities(newQuantities);
        }
    };

    useEffect(() => {
        fetchData();
    }, [refreshDataList]);

    useEffect(() => {
        setQuantities(dataList.map(() => 0));
    }, [dataList]);

    useEffect(() => {
        const orderSummary = dataList
            .map((product, index) => ({
                ...product,
                quantity: quantities[index],
            }))
            .filter((product) => product.quantity > 0);

        const total = orderSummary.reduce(
            (sum, product) => sum + product.product_price * product.quantity,
            0
        );
        setTotalOrder(total);
    }, [dataList, quantities]);

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
            const enabledProducts = data.filter(
                (product) => !product.product_disabled
            );
            setDataList(enabledProducts);
        } else {
            //set blank
            setDataList([]);
        }

        setIsLoading(false);
    }

    const openModal = () => {
        const orderSummary = dataList
            .map((product, index) => ({
                ...product,
                quantity: quantities[index],
            }))
            .filter((product) => product.quantity > 0);
        if (orderSummary.length === 0) {
            alert("No order to display.");
        } else if (dinePreference === "") {
            alert("Please select a dine preference.");
        } else {
            const total = orderSummary.reduce(
                (sum, product) =>
                    sum + product.product_price * product.quantity,
                0
            );
            setTotalOrder(total);
            setCurrentData(orderSummary);
            setModalState(true);
        }
    };
    const closeModal = () => {
        setModalState(false);
    };

    const handleConfirmOrder = async () => {
        if (antiSpam) return; // Prevent multiple submissions
        setAntiSpam(true);
    
        try {
            // First, check if all items in the order are available
            for (const product of currentData) {
                const { data: recipes, error: recipeError } = await supabase
                    .from("recipe")
                    .select("*")
                    .eq("product_id", product.product_id);
    
                if (recipeError) {
                    console.error("Error fetching recipe: ", recipeError);
                    throw new Error("Error fetching recipe");
                }
    
                for (const recipe of recipes) {
                    const { data: stockItems, error: stockError } = await supabase
                        .from("stocks")
                        .select("*")
                        .eq("stock_id", recipe.stock_id);
    
                    if (stockError) {
                        console.error("Error fetching stock item: ", stockError);
                        throw new Error("Error fetching stock item");
                    }
    
                    const stockItem = stockItems[0];
                    if (
                        stockItem.stock_quantity <
                        recipe.recipe_quantity * product.quantity
                    ) {
                        alert(`Not enough stock for ${product.product_name}`);
                        setModalState(false);
                        setAntiSpam(false);
                        return; // Stop the process if any item is not available
                    }
                }
            }
    
            // If all items are available, proceed to deduct the stock
            for (const product of currentData) {
                const { data: recipes } = await supabase
                    .from("recipe")
                    .select("*")
                    .eq("product_id", product.product_id);
    
                for (const recipe of recipes) {
                    const { data: stockItems } = await supabase
                        .from("stocks")
                        .select("*")
                        .eq("stock_id", recipe.stock_id);
    
                    const stockItem = stockItems[0];
                    stockItem.stock_quantity -=
                        recipe.recipe_quantity * product.quantity;
    
                    const { error: updateError } = await supabase
                        .from("stocks")
                        .update({ stock_quantity: stockItem.stock_quantity })
                        .eq("stock_id", stockItem.stock_id);
    
                    if (updateError) {
                        console.error("Error updating stock item: ", updateError);
                        throw new Error("Error updating stock item");
                    }
                }
            }
    
            // Add the receipt
            const receipt = {
                receipt_ordertype: dinePreference,
                receipt_orderlist: JSON.stringify(
                    currentData.map((item) => ({
                        product_id: item.product_id,
                        product_name: item.product_name,
                        quantity: item.quantity,
                        total_price: item.product_price * item.quantity,
                    }))
                ),
                receipt_ordertotal: totalOrder,
            };
    
            const { data: insertedReceipt, error: insertError } = await supabase
                .from("receipt")
                .insert(receipt)
                .select();  // Ensure it returns the inserted data
    
            if (insertError) {
                console.error("Error inserting receipt: ", insertError);
                throw new Error("Error inserting receipt");
            }
    
            // Ensure we have the inserted receipt data
            if (insertedReceipt.length === 0) {
                throw new Error("No receipt data returned after insert");
            }
    
            // Add log after successful order
            const log = {
                log_title: "SUCCESSFUL ORDER",
                log_description: `Receipt id: ${insertedReceipt[0].receipt_id}`,
                log_user_id: user_id
            };
    
            const { error: logError } = await supabase
                .from("log")
                .insert(log);
    
            if (logError) {
                console.error("Error inserting log: ", logError);
                throw new Error("Error inserting log");
            }
    
            alert("Order successful!");
            setModalState(false);
            setAntiSpam(false);
            setRefreshDataList(!refreshDataList);
            setDinePreference("");
        } catch (error) {
            console.error("Order confirmation failed: ", error);
            alert("Order confirmation failed. Please try again.");
            setAntiSpam(false);
        }
    };

    const handleDinePreferenceChange = (event) => {
        setDinePreference(event.target.value);
    };

    //MARK: FRONT
    return (
        <div className="page">
            <Sidebar />
            <div className="page-content">
                <h1>POS</h1>

                <div className="side">
                    <div className="products-container">
                        {dataList.map((product, index) => (
                            <ProductCard
                                key={index}
                                product={product}
                                quantity={quantities[index]}
                                handleAdd={() => handleAdd(index)}
                                handleRemove={() => handleRemove(index)}
                            />
                        ))}
                    </div>

                    <div className="summary-container">
                        <div className="summary-list">
                            <h2>Order</h2>
                            <table className="summary-table">
                                <thead>
                                    <tr>
                                        <th className="left-align">
                                            Product Name
                                        </th>
                                        <th className="left-align">Quantity</th>
                                        <th className="left-align">Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dataList
                                        .map((product, index) => ({
                                            ...product,
                                            quantity: quantities[index],
                                        }))
                                        .filter(
                                            (product) => product.quantity > 0
                                        )
                                        .map((product, index) => (
                                            <tr key={index}>
                                                <td>{product.product_name}</td>
                                                <td>{product.quantity}</td>
                                                <td>
                                                    ₱
                                                    {product.product_price *
                                                        product.quantity}
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="column">
                            <h2>Total: ₱{totalOrder}</h2>
                            <Divider />
                            <div className="side-wo-flex">
                                <FormControl
                                    sx={{ minWidth: 160 }}
                                    size="small"
                                >
                                    <InputLabel>Dine Preference</InputLabel>
                                    <Select
                                        value={dinePreference}
                                        label="Dine Preference"
                                        onChange={handleDinePreferenceChange}
                                    >
                                        <MenuItem value="">
                                            <em>None</em>
                                        </MenuItem>
                                        <MenuItem value={"Dine-in"}>
                                            Dine-in
                                        </MenuItem>
                                        <MenuItem value={"Take-out"}>
                                            Take-out
                                        </MenuItem>
                                    </Select>
                                </FormControl>

                                <Button
                                    variant="outlined"
                                    startIcon={<ShoppingCartCheckout />}
                                    onClick={openModal}
                                >
                                    Checkout
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                <Modal open={modalState} onClose={closeModal}>
                    <Box className="modal">
                        {currentData && (
                            <div>
                                <h2>Order Summary</h2>
                                <table className="summary-table">
                                    <thead>
                                        <tr>
                                            <th className="left-align">
                                                Product Name
                                            </th>
                                            <th className="left-align">
                                                Quantity
                                            </th>
                                            <th className="left-align">
                                                Total Price
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentData.map((product, index) => (
                                            <tr key={index}>
                                                <td>{product.product_name}</td>
                                                <td>{product.quantity}</td>
                                                <td>
                                                    ₱
                                                    {product.product_price *
                                                        product.quantity}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <Divider />
                                <h4>Dine Preference: {dinePreference}</h4>
                                <h3>Total Order: ₱{totalOrder}</h3>

                                <Button
                                    disabled={antiSpam}
                                    variant="contained"
                                    onClick={handleConfirmOrder}
                                >
                                    Confirm Order
                                </Button>
                            </div>
                        )}
                    </Box>
                </Modal>
            </div>
        </div>
    );
}

function ProductCard({ product, quantity, handleAdd, handleRemove }) {
    return (
        <Card className="product-card">
            <CardContent>
                <Typography variant="h5" component="div">
                    {product.product_name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    Price: ₱{product.product_price}
                </Typography>
            </CardContent>
            <Divider />
            <CardActions>
                <Button size="small" onClick={handleRemove}>
                    <Remove />
                </Button>
                <Typography variant="body2" color="text.secondary">
                    Quantity: {quantity}
                </Typography>
                <Button size="small" onClick={handleAdd}>
                    <Add />
                </Button>
            </CardActions>
        </Card>
    );
}
