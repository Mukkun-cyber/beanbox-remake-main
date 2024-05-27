import { React, useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import supabase from "../utils/supabase";
import {
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    ListItemText,
    TextField,
    Typography,
} from "@mui/material";
import { AccountCircle } from "@mui/icons-material";
import bcrypt from "bcryptjs";
import { BarChart } from "@mui/x-charts";

export default function Dashboard() {
    //MARK: INIT
    const [lowStocks, setLowStocks] = useState([]);
    const [dailySales, setDailySales] = useState(0);
    const [monthlySales, setMonthlySales] = useState(0);
    const [open, setOpen] = useState(false);
    const [userDetails, setUserDetails] = useState({});
    const [user_id, setUser_id] = useState(localStorage.getItem("user_id"));
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [popularItems, setPopularItems] = useState([]);

    const [barCategories, setBarCategories] = useState([]);
    const [seriesData, setSeriesData] = useState([]);

    useEffect(() => {
        fetchLowStocks();
        fetchTotalSales();
        fetchPopularItems();
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            const { data: stocksData, error } = await supabase
                .from("stocks")
                .select("*");

            if (error) {
                console.error("Error: ", error);
                return;
            }

            // Assuming the stocksData is an array of objects with 'name' and 'value' properties
            setBarCategories(stocksData.map((stock) => stock.stock_name));
            setSeriesData(stocksData.map((stock) => stock.stock_quantity));
        };

        fetchData();
    }, []);

    const fetchLowStocks = async () => {
        const { data, error } = await supabase.from("stocks").select("*");

        if (error) {
            console.error("Error fetching low stocks:", error);
        } else {
            const filteredStocks = data.filter(
                (stock) => stock.stock_quantity < stock.stock_minimum
            );
            setLowStocks(filteredStocks);
        }
    };

    const fetchTotalSales = async () => {
        const today = new Date();
        const startOfDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );
        const startOfWeek = new Date(
            today.setDate(today.getDate() - today.getDay())
        );
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const { data, error } = await supabase
            .from("receipt")
            .select("receipt_ordertotal, receipt_created_at");

        if (error) {
            console.error("Error fetching total sales:", error);
        } else {
            const dailyTotal = data.reduce((sum, receipt) => {
                const receiptTotal = Number(receipt.receipt_ordertotal);
                const receiptDate = new Date(receipt.receipt_created_at);
                return isNaN(receiptTotal) || receiptDate < startOfDay
                    ? sum
                    : sum + receiptTotal;
            }, 0);
            setDailySales(dailyTotal);

            const monthlyTotal = data.reduce((sum, receipt) => {
                const receiptTotal = Number(receipt.receipt_ordertotal);
                const receiptDate = new Date(receipt.receipt_created_at);
                return isNaN(receiptTotal) || receiptDate < startOfMonth
                    ? sum
                    : sum + receiptTotal;
            }, 0);
            setMonthlySales(monthlyTotal);
        }
    };

    const fetchPopularItems = async () => {
        const { data, error } = await supabase
            .from("receipt")
            .select("receipt_orderlist");

        if (error) {
            console.error("Error fetching popular items:", error);
        } else {
            const productCounts = {};

            data.forEach((receipt) => {
                const orderList = JSON.parse(receipt.receipt_orderlist);
                orderList.forEach((item) => {
                    if (productCounts[item.product_id]) {
                        productCounts[item.product_id].quantity +=
                            item.quantity;
                    } else {
                        productCounts[item.product_id] = {
                            name: item.product_name,
                            quantity: item.quantity,
                        };
                    }
                });
            });

            const popularItems = Object.values(productCounts)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            setPopularItems(popularItems);
        }
    };

    const handleShowProfile = async () => {
        const { data: userData, error } = await supabase
            .from("users")
            .select("*")
            .eq("user_id", user_id)
            .single();

        if (error) {
            console.error("Error: ", error);
            return;
        }

        setUserDetails(userData);
        setOpen(true);
    };

    const handleChangePasswordClick = () => {
        setChangePasswordOpen(true);
    };

    const handleChangePassword = async (currentPassword, newPassword) => {
        const { data: userData, error: fetchError } = await supabase
            .from("users")
            .select("*")
            .eq("user_id", user_id)
            .single();

        const isValidPassword = bcrypt.compareSync(
            currentPassword,
            userData.user_password
        );

        if (!isValidPassword) {
            alert("Current password is incorrect");
            return;
        }

        // Encrypt the password
        const salt = bcrypt.genSaltSync(10);
        const encryptedPassword = bcrypt.hashSync(newPassword, salt);

        // Update the password in the database
        const { error: updateError } = await supabase
            .from("users")
            .update({ user_password: encryptedPassword })
            .eq("user_id", user_id);

        if (updateError) {
            console.error("Update Error: ", updateError);
            return;
        }
        alert("Password updated successfully");

        setChangePasswordOpen(false);
    };

    //MARK: FRONT
    return (
        <div className="page">
            <Sidebar />
            <div className="page-content">
                <div className="space-between">
                    <h1>Dashboard</h1>
                    <IconButton
                        onClick={handleShowProfile}
                        style={{ fontSize: "2em" }}
                    >
                        <AccountCircle
                            className="actionicon"
                            style={{ fontSize: "2em" }}
                        />
                    </IconButton>
                </div>
                <div className="column">
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <Card
                            style={{
                                display: "inline-flex",
                                maxWidth: "fit-content",
                            }}
                        >
                            <CardContent>
                                <Typography variant="h5" component="div">
                                    LOW STOCKS
                                </Typography>
                                {lowStocks.length > 0 ? (
                                    <List>
                                        {lowStocks.map((stock, index) => (
                                            <ListItem key={index}>
                                                <ListItemText
                                                    primary={stock.stock_name}
                                                    secondary={`Quantity: ${stock.stock_quantity} (Minimum: ${stock.stock_minimum})`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                ) : (
                                    <Typography
                                        variant="body2"
                                        color="text.secondary"
                                    >
                                        No low stocks.
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>

                        <Card
                            style={{
                                display: "inline-flex",
                                maxWidth: "fit-content",
                                margin: "0 10px",
                            }}
                        >
                            <CardContent>
                                <Typography variant="h5" component="div">
                                    TOTAL SALES
                                </Typography>
                                <List>
                                    <ListItem>
                                        <ListItemText
                                            primary="Daily Sales"
                                            secondary={`Total: ${dailySales}`}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Monthly Sales"
                                            secondary={`Total: ${monthlySales}`}
                                        />
                                    </ListItem>
                                </List>
                            </CardContent>
                        </Card>

                        <Card
                            style={{
                                display: "inline-flex",
                                maxWidth: "fit-content",
                                margin: "0 10px",
                            }}
                        >
                            <CardContent>
                                <Typography variant="h5" component="div">
                                    POPULAR ITEMS
                                </Typography>
                                <List>
                                    {popularItems.map((item, index) => (
                                        <ListItem key={index}>
                                            <ListItemText
                                                primary={item.name}
                                                secondary={`Quantity: ${item.quantity}`}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            </CardContent>
                        </Card>
                    </div>
                    <BarChart
                        xAxis={[
                            {
                                id: "barCategories",
                                data: barCategories,
                                scaleType: "band",
                            },
                        ]}
                        series={[
                            {
                                data: seriesData,
                            },
                        ]}
                        width={1000}
                        height={300}
                    />
                </div>

                <Dialog open={open} onClose={() => setOpen(false)}>
                    <DialogTitle>Account Details</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            {/* Display user details here */}
                            User ID: {userDetails.user_id}
                            <br />
                            Email: {userDetails.user_email}
                            <br />
                            Role: {userDetails.user_role}
                            <br />
                            {/* Add more fields as needed */}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={handleChangePasswordClick}
                            color="primary"
                        >
                            Change Password
                        </Button>
                        <Button onClick={() => setOpen(false)} color="primary">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog
                    open={changePasswordOpen}
                    onClose={() => setChangePasswordOpen(false)}
                >
                    <DialogTitle>Change Password</DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            id="current-password"
                            label="Current Password"
                            type="password"
                            fullWidth
                            variant="standard"
                        />
                        <TextField
                            margin="dense"
                            id="new-password"
                            label="New Password"
                            type="password"
                            fullWidth
                            variant="standard"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button
                            onClick={() =>
                                handleChangePassword(
                                    document.getElementById("current-password")
                                        .value,
                                    document.getElementById("new-password")
                                        .value
                                )
                            }
                            color="primary"
                        >
                            Change Password
                        </Button>
                        <Button
                            onClick={() => setChangePasswordOpen(false)}
                            color="primary"
                        >
                            Cancel
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </div>
    );
}
