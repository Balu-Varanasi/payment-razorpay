import { jest } from "@jest/globals";
import dotenv from "dotenv";
import Razorpay from "razorpay";
import { Customers } from "razorpay/dist/types/customers";

import { ErrorCodes, ErrorIntentStatus } from "../../types";
import { PaymentIntentDataByStatus } from "../__fixtures__/data";

dotenv.config();

const mockEnabled = process.env.DISABLE_MOCKS == "true" ? false : true;

export const WRONG_CUSTOMER_EMAIL = "wrong@test.net";
export const EXISTING_CUSTOMER_ID = "cus_01JMW6SDES9T1SNEMTJFNFGYAK";
export const EXISTING_CUSTOMER_EMAIL = "vabasu@gmail.com";
export const EXISTING_CUSTOMER_CONTACT = "+919876543210";
export const EXISTING_SESSION_ID = "session_01JMW6SDES9T1SNEMTJFNFGYAK";
export const RAZORPAY_ID = isMocksEnabled() ? "test" : process.env.RAZORPAY_ID;
export const PARTIALLY_FAIL_INTENT_ID = "partially_unknown";
export const FAIL_INTENT_ID = "unknown";

export function isMocksEnabled(): boolean {
    if (mockEnabled) {
        console.log("using mocks");
    }
    return mockEnabled;
}

export const RazorpayMock: any = {
    orders: {
        fetch: jest.fn().mockImplementation(async (orderId) => {
            if (orderId === FAIL_INTENT_ID) {
                throw new Error("Error");
            }

            return (
                Object.values(PaymentIntentDataByStatus).find((value) => {
                    return value.id === orderId;
                }) ?? {}
            );
        }),
        fetchPayments: jest.fn().mockImplementation(async (orderId) => {
            if (orderId === FAIL_INTENT_ID) {
                throw new Error("Error");
            }

            return (
                Object.values(PaymentIntentDataByStatus).find((value) => {
                    return value.id === orderId;
                }) ?? {}
            );
        }),
        edit: jest.fn().mockImplementation(async (orderId, updateData: any) => {
            if (orderId === FAIL_INTENT_ID) {
                throw new Error("Error");
            }

            const data =
                Object.values(PaymentIntentDataByStatus).find((value) => {
                    return value.id === orderId;
                }) ?? {};

            return { ...data, ...updateData };
        }),
        create: jest.fn().mockImplementation(async (data: any) => {
            if (data.description === "fail") {
                throw new Error("Error");
            }

            return data;
        }),
    },

    payments: {
        fetch: jest.fn().mockImplementation(async (paymentId) => {
            if (paymentId === FAIL_INTENT_ID) {
                throw new Error("Error");
            }

            return (
                Object.values(PaymentIntentDataByStatus).find((value) => {
                    return value.id === paymentId;
                }) ?? {}
            );
        }),
        edit: jest.fn().mockImplementation(async (paymentId, updateData: any) => {
            if (paymentId === FAIL_INTENT_ID) {
                throw new Error("Error");
            }

            const data =
                Object.values(PaymentIntentDataByStatus).find((value) => {
                    return value.id === paymentId;
                }) ?? {};

            return { ...data, ...updateData };
        }),
        create: jest.fn().mockImplementation(async (data: any) => {
            if (data.description === "fail") {
                throw new Error("Error");
            }

            return data;
        }),
        cancel: jest.fn().mockImplementation(async (paymentId) => {
            if (paymentId === FAIL_INTENT_ID) {
                throw new Error("Error");
            }

            if (paymentId === PARTIALLY_FAIL_INTENT_ID) {
                throw new Error(
                    JSON.stringify({
                        code: ErrorCodes.PAYMENT_INTENT_UNEXPECTED_STATE,
                        payment_intent: {
                            id: paymentId,
                            status: ErrorIntentStatus.CANCELED,
                        },
                        type: "invalid_request_error",
                    }),
                );
            }

            return { id: paymentId };
        }),
        capture: jest.fn().mockImplementation(async (paymentId) => {
            if (paymentId === FAIL_INTENT_ID) {
                throw new Error("Error");
            }

            if (paymentId === PARTIALLY_FAIL_INTENT_ID) {
                throw new Error(
                    JSON.stringify({
                        code: ErrorCodes.PAYMENT_INTENT_UNEXPECTED_STATE,
                        payment_intent: {
                            id: paymentId,
                            status: ErrorIntentStatus.SUCCEEDED,
                        } as any,
                        type: "invalid_request_error",
                    }),
                );
            }

            return { id: paymentId };
        }),
        refund: jest.fn().mockImplementation(async ({ payment_intent: paymentId }: any) => {
            if (paymentId === FAIL_INTENT_ID) {
                throw new Error("Error");
            }

            return { id: paymentId };
        }),
    },
    refunds: {
        fetch: jest.fn().mockImplementation(async (paymentId) => {
            if (paymentId === FAIL_INTENT_ID) {
                throw new Error("Error");
            }

            return (
                Object.values(PaymentIntentDataByStatus).find((value) => {
                    return value.id === paymentId;
                }) ?? {}
            );
        }),
    },
    customers: {
        create: jest.fn().mockImplementation(async (data: any) => {
            if (data.email === EXISTING_CUSTOMER_EMAIL) {
                return { id: RAZORPAY_ID, ...data };
            }

            throw new Error("Error");
        }),
        fetch: jest.fn().mockImplementation(async (data: any) => {
            const customer: Customers.RazorpayCustomer = {
                id: "TEST-CUSTOMER",
                entity: "customer",
                created_at: 0,
                name: "test customer",
                email: EXISTING_CUSTOMER_EMAIL,
                contact: EXISTING_CUSTOMER_CONTACT,
            };
            return Promise.resolve(customer);
        }),
        edit: jest.fn().mockImplementation(async (id, data) => {
            const customer: Customers.RazorpayCustomer = {
                id: id as string,
                entity: "customer",
                created_at: 0,
                name: "test customer",
                email: EXISTING_CUSTOMER_EMAIL,
                contact: EXISTING_CUSTOMER_CONTACT,
            };
            return Promise.resolve(customer);
        }),
    },
};

const razorpay: Razorpay | typeof RazorpayMock = isMocksEnabled() ? jest.fn(() => RazorpayMock) : Razorpay;

export default razorpay;
