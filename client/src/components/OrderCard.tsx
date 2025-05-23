import React, { useState, useEffect } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
    Checkbox,
    Box,
    Text,
    Flex,
    useDisclosure,
} from "@chakra-ui/react";
import { Order } from "./AdminOrdersTracking";
import { apiRequest } from "../api/apiRequest";

type OrderCardProps = {
    order: Order;
    onOrderUpdate?: (updatedOrder: Order) => void;
};

const OrderCard: React.FC<OrderCardProps> = ({
    order: initialOrder,
    onOrderUpdate,
}) => {
    // Use a local state to track the order data
    const [order, setOrder] = useState<Order>(initialOrder);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);
    const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(
        null
    );

    // Update local state when prop changes
    useEffect(() => {
        setOrder(initialOrder);
    }, [initialOrder]);

    useEffect(() => {}, [order]);

    // Parse the createdDate string into a Date object
    const parsedDate = new Date(order.createdDate);
    const isValidDate = !isNaN(parsedDate.getTime());

    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);

    const handleToggleCompletion = (itemIndex: number) => {
        setSelectedItemIndex(itemIndex);
        setConfirmModalOpen(true);
    };

    const confirmCompletion = async () => {
        if (selectedItemIndex === null) return;

        try {
            // Create a deep copy of the items array
            const updatedItems = order.items.map((item, idx) => {
                if (idx === selectedItemIndex) {
                    return {
                        ...item,
                        item_completed: !item.item_completed,
                    };
                }
                return item;
            });

            const allCompleted = updatedItems.every(
                (item) => item.item_completed
            );
            // Immediately update local state for responsive UI
            const updatedOrder = {
                ...order,
                items: updatedItems,
                deliveryStatus: allCompleted
                    ? "completed"
                    : order.deliveryStatus,
            };
            setOrder(updatedOrder);

            // Also notify parent component if callback exists
            if (onOrderUpdate) {
                onOrderUpdate(updatedOrder);
            }

            // Make API call to persist changes
            const response = await apiRequest(
                "order",
                "PUT",
                `update/${order?._id}`,
                {
                    items: updatedItems,
                    ...(allCompleted && { deliveryStatus: "completed" }),
                }
            );

            if (!response.success) {
                console.error("Failed to update order:", response.message);
                alert(response.message || "Failed to update order.");

                // Revert local state if API call fails
                setOrder(initialOrder);
                if (onOrderUpdate) {
                    onOrderUpdate(initialOrder);
                }
            }
        } catch (error) {
            console.error("Error updating order:", error);
            alert("An error occurred while updating the order.");

            // Revert local state if API call fails
            setOrder(initialOrder);
            if (onOrderUpdate) {
                onOrderUpdate(initialOrder);
            }
        } finally {
            setConfirmModalOpen(false);
        }
    };

    // Calculate completed items from current state
    const completedItems = order.items.filter(
        (item) => item.item_completed
    ).length;
    const totalItems = order.items.length;

    return (
        <div className="bg-gray-100 p-4 rounded-lg shadow-md my-4">
            {/* Summary Section */}
            <div className="flex justify-between items-center">
                <div className="flex items-center">
                    <img
                        src={
                            order.items[0]?.images?.[0] || "/default-image.jpg"
                        }
                        alt="Item Image"
                        className="w-16 h-16 rounded"
                    />
                    <div className="ml-4">
                        <p className="font-semibold">
                            Customer: {order.username}
                        </p>
                        <p>Item: {order.items[0]?.title}</p>
                        <p>
                            Quantity: {order.items[0]?.quantity} | Price: $
                            {order.items[0]?.price}
                        </p>
                        <p>
                            Delivery: {order.deliveryMethod?.replace("-", " ")}
                        </p>
                    </div>
                </div>
                <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="flex-end"
                >
                    {/* Status */}
                    <span
                        className={`px-3 py-1 rounded text-white ${
                            completedItems === totalItems
                                ? "bg-blue-700"
                                : "bg-blue-300"
                        }`}
                    >
                        {completedItems === totalItems
                            ? "Status: Completed!"
                            : `Status: ${completedItems}/${totalItems} Completed`}
                    </span>

                    {/* Total Summary */}
                    <Box textAlign="right" mt={10}>
                        <Text fontWeight="bold">
                            Total {totalItems} item(s):
                        </Text>
                        <Text>
                            ${order.totalAmount}{" "}
                            <Text as="span" color="gray.500">
                                (incl. Delivery Fees)
                            </Text>
                        </Text>
                    </Box>
                </Box>
            </div>

            {/* View More / View Less Button */}
            <div className="mt-2">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-blue-500 underline"
                >
                    {isExpanded ? "View Less ▲" : "View More / Edit ▼"}
                </button>
            </div>

            {/* Detailed View Section */}
            {isExpanded && (
                <div className="mt-4 bg-gray-200 p-4 rounded-lg">
                    {/* Customer Information */}
                    <Box mb={4}>
                        <Text fontWeight="bold">Customer Name:</Text>
                        <Text>{order.username}</Text>
                    </Box>

                    {/* Items List */}
                    <Box mb={4}>
                        <Text fontWeight="bold">All Items in the Order:</Text>
                        <ul>
                            {order.items.map((item, index) => (
                                <li
                                    key={index}
                                    style={{ marginBottom: "1rem" }}
                                >
                                    <Flex
                                        alignItems="center"
                                        justifyContent="space-between"
                                    >
                                        {/* Item Image */}
                                        <img
                                            src={
                                                item.images[0] ||
                                                "/default-image.jpg"
                                            }
                                            alt="Item Image"
                                            className="w-16 h-16 rounded mr-4"
                                        />

                                        {/* Item Details */}
                                        <Box flexGrow={1}>
                                            <Text fontWeight="bold">
                                                Item Name:
                                            </Text>
                                            <Text>{item.title}</Text>
                                            <Text>
                                                Colour: {item.colour} | Size:{" "}
                                                {item.size} | Quantity:{" "}
                                                {item.quantity} | Price: $
                                                {item.price}
                                            </Text>
                                            <Text>
                                                Delivery:{" "}
                                                {order.deliveryMethod?.replace(
                                                    "-",
                                                    " "
                                                )}
                                            </Text>
                                        </Box>

                                        {/* Completion Checkbox */}
                                        <Flex alignItems="center">
                                            <Text>Completed:</Text>
                                            <Checkbox
                                                isChecked={item.item_completed}
                                                onChange={() =>
                                                    handleToggleCompletion(
                                                        index
                                                    )
                                                }
                                                borderColor="blue.500"
                                                borderWidth="2px"
                                                ml={2}
                                            />
                                        </Flex>
                                    </Flex>
                                    <hr
                                        style={{
                                            marginTop: "0.5rem",
                                            marginBottom: "0.5rem",
                                        }}
                                    />
                                </li>
                            ))}
                        </ul>
                    </Box>

                    <Modal
                        isOpen={isConfirmModalOpen}
                        onClose={() => setConfirmModalOpen(false)}
                    >
                        <ModalOverlay />
                        <ModalContent>
                            <ModalHeader>
                                {selectedItemIndex !== null &&
                                order.items[selectedItemIndex]?.item_completed
                                    ? "Mark as incomplete"
                                    : "Confirm completion"}
                            </ModalHeader>
                            <ModalBody>
                                <Text>Customer Name: {order.username} </Text>
                                <Text>
                                    Item Name:{" "}
                                    {selectedItemIndex !== null &&
                                        order.items[selectedItemIndex]
                                            ?.title}{" "}
                                </Text>

                                <Text>
                                    Colour:{" "}
                                    {selectedItemIndex !== null &&
                                        order.items[selectedItemIndex]
                                            ?.colour}{" "}
                                    | Size:{" "}
                                    {selectedItemIndex !== null &&
                                        order.items[selectedItemIndex]
                                            ?.size}{" "}
                                    | Quantity:{" "}
                                    {selectedItemIndex !== null &&
                                        order.items[selectedItemIndex]
                                            ?.quantity}{" "}
                                    | Price: $
                                    {selectedItemIndex !== null &&
                                        order.items[selectedItemIndex]?.price}
                                </Text>
                                <Text>
                                    Delivery:{" "}
                                    {order.deliveryMethod?.replace("-", " ")}
                                </Text>
                            </ModalBody>
                            <ModalFooter>
                                <Button
                                    colorScheme="blue"
                                    mr={3}
                                    onClick={confirmCompletion}
                                >
                                    Confirm
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => setConfirmModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                            </ModalFooter>
                        </ModalContent>
                    </Modal>

                    {/* Additional Order Information */}
                    <Box mb={4}>
                        <Text fontWeight="bold">Ordered on:</Text>
                        <Text>
                            {isValidDate
                                ? `${String(parsedDate.getDate()).padStart(
                                      2,
                                      "0"
                                  )}-${String(
                                      parsedDate.getMonth() + 1
                                  ).padStart(2, "0")}-${parsedDate
                                      .getFullYear()
                                      .toString()
                                      .slice(-2)} ${String(
                                      parsedDate.getHours()
                                  ).padStart(2, "0")}:${String(
                                      parsedDate.getMinutes()
                                  ).padStart(2, "0")}`
                                : "Invalid Date"}
                        </Text>
                        {order.deliveryStatus === "delivered" && (
                            <React.Fragment>
                                <Text fontWeight="bold">Order Completed:</Text>
                                <Text>
                                    {isValidDate
                                        ? `${String(
                                              parsedDate.getDate()
                                          ).padStart(2, "0")}-${String(
                                              parsedDate.getMonth() + 1
                                          ).padStart(2, "0")}-${parsedDate
                                              .getFullYear()
                                              .toString()
                                              .slice(-2)} ${String(
                                              parsedDate.getHours()
                                          ).padStart(2, "0")}:${String(
                                              parsedDate.getMinutes()
                                          ).padStart(2, "0")}`
                                        : "Invalid Date"}
                                </Text>
                            </React.Fragment>
                        )}
                        {order.trackingNumber && (
                            <React.Fragment>
                                <Text fontWeight="bold">
                                    Delivery Tracking Number:
                                </Text>
                                <Text>{order.trackingNumber}</Text>
                            </React.Fragment>
                        )}
                        {order.deliveryMethod !== "self-collection" && (
                            <React.Fragment>
                                <Text fontWeight="bold">Shipping Address:</Text>
                                <Text>
                                    {order.address}
                                    {/* {order.city},{" "}
                                    {order.country}, {order.zipCode} */}
                                </Text>
                            </React.Fragment>
                        )}
                    </Box>

                    {/* Summary */}
                    <Box textAlign="right">
                        <Text fontWeight="bold">
                            Total {totalItems} item(s):
                        </Text>
                        <Text>
                            ${order.totalAmount}{" "}
                            <Text as="span" color="gray.500">
                                (incl. Delivery Fees)
                            </Text>
                        </Text>
                    </Box>
                </div>
            )}
        </div>
    );
};

export default OrderCard;
