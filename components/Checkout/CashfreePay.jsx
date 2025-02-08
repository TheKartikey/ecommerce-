"use client"; // Ensures this runs only on the client side

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrderAPI } from "@/actions/orders.actions.js";
import PrimaryButton from "@/components/Button/PrimaryButton";
import axios from "axios";

export default function CashfreePayment({
    dict,
    customer,
    cartValue,
    mrp,
    taxes,
    coupon,
    shippingFeesMinValue,
    shippingFees,
    expectedDelivery,
}) {
    const router = useRouter();
    const [isSDKLoaded, setSDKLoaded] = useState(false);

    // Load Cashfree SDK only once
    useEffect(() => {
        if (!document.getElementById("cashfree-sdk")) {
            const script = document.createElement("script");
            script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
            script.id = "cashfree-sdk";
            script.onload = () => setSDKLoaded(true);
            document.body.appendChild(script);
        } else {
            setSDKLoaded(true);
        }
    }, []);

    // Create order in the backend
    const handleCreateOrder = async (variables) => {
        try {
            const response = await createOrderAPI(variables);
            if (response?.status === 200) {
                router.push(`/payment/success/order_id=${response._id}`);
            } else {
                router.push("/payment/failed");
            }
        } catch (error) {
            console.error("Order Creation Error:", error);
            router.push("/payment/failed");
        }
    };

    // Initiate Cashfree Payment
    async function createCashfreeOrder() {
        try {
            const orderId =`ORD${Math.floor(Math.random() * 1000000000)}`;

            const requestData = {
                orderId,
                amount: cartValue,
                customerName: customer.name,
                customerEmail: customer.email,
                customerPhone: customer.phoneNumber,
                customerId: `CUST${Math.floor(Math.random() * 1000000000)}`,
            };

            console.log("Requesting Payment:", requestData);

            const response = await axios.post(
                "https://45c8-2401-4900-1ca3-3df1-a400-aae7-6970-1b36.ngrok-free.app/api/payment/create-payment",
                requestData
            );

            console.log("Payment Response:", response);

            if (response.status === 200 && response.data.success) {
                const { payment_session_id, order_meta } = response.data.data;
            
                if (!payment_session_id) {
                    console.error("❌ Missing payment_session_id! Payment cannot proceed.");
                    alert("Payment failed: Invalid session. Please try again.");
                    return;
                }
            
                console.log("✅ Extracted payment_session_id:", payment_session_id);
            
                if (isSDKLoaded && window.Cashfree) {
                    const cashfree = new window.Cashfree({ mode: "sandbox" });
                    console.log("✅ Cashfree SDK Loaded:", cashfree);
            
                    cashfree.checkout({
                        paymentSessionId: payment_session_id,
                        redirectTarget: "_self",
                    });
                } else {
                    alert("⚠️ Cashfree SDK not loaded. Please try again.");
                }
            } else {
                alert("❌ Failed to initiate payment. Please try again.");
            }
            
        } catch (error) {
            console.error("❌ Payment Error:", error);
            alert("Error processing payment. Please try again.");
        }
    }

    return (
        <div onClick={createCashfreeOrder}>
            <PrimaryButton text={dict.checkout.cashfreeTitle || "Pay with Cashfree"} />
        </div>
    );
}
