import {
    AuthorizePaymentOutput,
    CancelPaymentOutput,
    CapturePaymentOutput,
    DeletePaymentOutput,
    HttpTypes,
    InitiatePaymentInput,
    RefundPaymentInput,
    RefundPaymentOutput,
    RetrievePaymentOutput,
} from "@medusajs/types";
import { PaymentSessionStatus } from "@medusajs/utils";
import {
    EXISTING_CUSTOMER_CONTACT,
    EXISTING_CUSTOMER_EMAIL,
    EXISTING_CUSTOMER_ID,
    EXISTING_SESSION_ID,
    FAIL_INTENT_ID,
    PARTIALLY_FAIL_INTENT_ID,
    RAZORPAY_ID,
    WRONG_CUSTOMER_EMAIL,
} from "../__mocks__/razorpay";

export const PaymentIntentDataByStatus = {
    ATTEMPTED: {
        id: EXISTING_CUSTOMER_ID,
    },
    SUCCEEDED: {
        id: EXISTING_CUSTOMER_ID,
    },
    CANCELED: {
        id: EXISTING_CUSTOMER_ID,
    },
    FAILED: {
        id: EXISTING_CUSTOMER_ID,
    },
    UNKNOWN: {
        id: EXISTING_CUSTOMER_ID,
    },
    CREATED: {
        id: EXISTING_CUSTOMER_ID,
    },
};
// INITIATE PAYMENT DATA

const rawStoreCart: any = {
    id: "cart_01JNGBJJXQ8HQ4J4CPKC7HZRT2",
    currency_code: "inr",
    email: EXISTING_CUSTOMER_EMAIL,
    region_id: "reg_01JMMHV5RMMT3S092P136WHM92",
    created_at: "2025-03-04T10:35:11.160Z",
    updated_at: "2025-03-04T10:35:59.332Z",
    completed_at: null,
    total: 11000,
    subtotal: 11000,
    tax_total: 0,
    discount_total: 0,
    discount_subtotal: 0,
    discount_tax_total: 0,
    original_total: 11000,
    original_tax_total: 0,
    item_total: 1000,
    item_subtotal: 1000,
    item_tax_total: 0,
    original_item_total: 1000,
    original_item_subtotal: 1000,
    original_item_tax_total: 0,
    shipping_total: 10000,
    shipping_subtotal: 10000,
    shipping_tax_total: 0,
    original_shipping_tax_total: 0,
    original_shipping_subtotal: 10000,
    original_shipping_total: 10000,
    metadata: null,
    sales_channel_id: "sc_01JMMHV081NZ7R165WK9G077T0",
    shipping_address_id: "caaddr_01JNGBM1Z3P3SCAFM382CB2VQH",
    billing_address_id: "caaddr_01JNGBM1Z3QHEXPXQG08R9Q158",
    customer_id: "cus_01JMVM4YRAFC6RQ8Y1HVB34D3X",
    items: [
        {
            id: "cali_01JNGBJK642TXHK3XTEXRC9FNK",
            title: "L",
            subtitle: "Medusa Sweatshirt",
            thumbnail: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
            quantity: 1,
            variant_id: "variant_01JMMHV637E12DQCTPES8GM9RW",
            product_id: "prod_01JMMHV5ZTVVKJ61BJHR3CWR9P",
            product_title: "Medusa Sweatshirt",
            product_description:
                "Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.",
            product_subtitle: null,
            product_type: null,
            product_type_id: null,
            product_collection: null,
            product_handle: "sweatshirt",
            variant_sku: "SWEATSHIRT-L",
            variant_barcode: null,
            variant_title: "L",
            variant_option_values: null,
            requires_shipping: true,
            is_discountable: true,
            is_tax_inclusive: false,
            is_custom_price: false,
            metadata: {},
            cart_id: "cart_01JNGBJJXQ8HQ4J4CPKC7HZRT2",
            raw_compare_at_unit_price: null,
            raw_unit_price: {
                value: "1000",
                precision: 20,
            },
            created_at: "2025-03-04T10:35:11.429Z",
            updated_at: "2025-03-04T10:35:11.429Z",
            deleted_at: null,
            adjustments: [],
            tax_lines: [],
            compare_at_unit_price: null,
            unit_price: 1000,
            subtotal: 1000,
            total: 1000,
            original_total: 1000,
            discount_total: 0,
            discount_subtotal: 0,
            discount_tax_total: 0,
            tax_total: 0,
            original_tax_total: 0,
            raw_subtotal: {
                value: "1000",
                precision: 20,
            },
            raw_total: {
                value: "1000",
                precision: 20,
            },
            raw_original_total: {
                value: "1000",
                precision: 20,
            },
            raw_discount_total: {
                value: "0",
                precision: 20,
            },
            raw_discount_subtotal: {
                value: "0",
                precision: 20,
            },
            raw_discount_tax_total: {
                value: "0",
                precision: 20,
            },
            raw_tax_total: {
                value: "0",
                precision: 20,
            },
            raw_original_tax_total: {
                value: "0",
                precision: 20,
            },
            product: {
                id: "prod_01JMMHV5ZTVVKJ61BJHR3CWR9P",
                title: "Medusa Sweatshirt",
                handle: "sweatshirt",
                subtitle: null,
                description:
                    "Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.",
                is_giftcard: false,
                status: "published",
                thumbnail: "https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png",
                weight: "400",
                length: null,
                height: null,
                width: null,
                origin_country: null,
                hs_code: null,
                mid_code: null,
                material: null,
                discountable: true,
                external_id: null,
                metadata: null,
                type_id: null,
                type: null,
                collection_id: null,
                collection: null,
                created_at: "2025-02-21T15:26:00.171Z",
                updated_at: "2025-02-21T15:26:00.171Z",
                deleted_at: null,
                tags: [],
                categories: [
                    {
                        id: "pcat_01JMMHV5YW6TEF65F0F126DPD4",
                    },
                ],
            },
            variant: {
                id: "variant_01JMMHV637E12DQCTPES8GM9RW",
                title: "L",
                sku: "SWEATSHIRT-L",
                barcode: null,
                ean: null,
                upc: null,
                allow_backorder: false,
                manage_inventory: true,
                hs_code: null,
                origin_country: null,
                mid_code: null,
                material: null,
                weight: null,
                length: null,
                height: null,
                width: null,
                metadata: null,
                variant_rank: 0,
                product_id: "prod_01JMMHV5ZTVVKJ61BJHR3CWR9P",
                product: {
                    id: "prod_01JMMHV5ZTVVKJ61BJHR3CWR9P",
                },
                created_at: "2025-02-21T15:26:00.299Z",
                updated_at: "2025-02-21T15:26:00.299Z",
                deleted_at: null,
            },
        },
    ],
    shipping_methods: [
        {
            amount: 10000,
            is_tax_inclusive: false,
            shipping_option_id: "so_01JMMHV5WCHZXGEZCA9G0Z9ZWB",
            name: "Standard Shipping",
            id: "casm_01JNGBMCK2H4698Y534M6V1DAP",
            tax_lines: [],
            adjustments: [],
        },
    ],
    shipping_address: {
        id: "caaddr_01JNGBM1Z3P3SCAFM382CB2VQH",
        first_name: "Balu",
        last_name: "Varanasi",
        company: "CHITRAM.AI PRIVATE LIMITED",
        address_1: "402, Sree Anjaneya Nivas",
        address_2: "",
        city: "Hyderabad",
        postal_code: "500049",
        country_code: "fr",
        province: "Telangana",
        phone: "+919876543210",
    },
    billing_address: {
        id: "caaddr_01JNGBM1Z3QHEXPXQG08R9Q158",
        first_name: "Balu",
        last_name: "Varanasi",
        company: "CHITRAM.AI PRIVATE LIMITED",
        address_1: "402, Sree Anjaneya Nivas",
        address_2: "",
        city: "Hyderabad",
        postal_code: "500049",
        country_code: "fr",
        province: "Telangana",
        phone: "+919876543210",
    },
    customer: {
        id: "cus_01JMVM4YRAFC6RQ8Y1HVB34D3X",
        email: EXISTING_CUSTOMER_EMAIL,
        groups: [],
    },
    region: {
        id: "reg_01JMMHV5RMMT3S092P136WHM92",
        name: "Europe",
        currency_code: "inr",
        automatic_taxes: true,
        metadata: null,
        created_at: "2025-02-21T15:25:59.966Z",
        updated_at: "2025-03-03T16:36:20.773Z",
        deleted_at: null,
        countries: [
            {
                iso_2: "dk",
                iso_3: "dnk",
                num_code: "208",
                name: "DENMARK",
                display_name: "Denmark",
                region_id: "reg_01JMMHV5RMMT3S092P136WHM92",
                metadata: null,
                created_at: "2025-02-21T15:25:46.976Z",
                updated_at: "2025-02-21T15:25:59.967Z",
                deleted_at: null,
            },
            {
                iso_2: "fr",
                iso_3: "fra",
                num_code: "250",
                name: "FRANCE",
                display_name: "France",
                region_id: "reg_01JMMHV5RMMT3S092P136WHM92",
                metadata: null,
                created_at: "2025-02-21T15:25:46.977Z",
                updated_at: "2025-02-21T15:25:59.967Z",
                deleted_at: null,
            },
            {
                iso_2: "de",
                iso_3: "deu",
                num_code: "276",
                name: "GERMANY",
                display_name: "Germany",
                region_id: "reg_01JMMHV5RMMT3S092P136WHM92",
                metadata: null,
                created_at: "2025-02-21T15:25:46.977Z",
                updated_at: "2025-02-21T15:25:59.967Z",
                deleted_at: null,
            },
            {
                iso_2: "it",
                iso_3: "ita",
                num_code: "380",
                name: "ITALY",
                display_name: "Italy",
                region_id: "reg_01JMMHV5RMMT3S092P136WHM92",
                metadata: null,
                created_at: "2025-02-21T15:25:46.977Z",
                updated_at: "2025-02-21T15:25:59.967Z",
                deleted_at: null,
            },
            {
                iso_2: "es",
                iso_3: "esp",
                num_code: "724",
                name: "SPAIN",
                display_name: "Spain",
                region_id: "reg_01JMMHV5RMMT3S092P136WHM92",
                metadata: null,
                created_at: "2025-02-21T15:25:46.979Z",
                updated_at: "2025-02-21T15:25:59.967Z",
                deleted_at: null,
            },
            {
                iso_2: "se",
                iso_3: "swe",
                num_code: "752",
                name: "SWEDEN",
                display_name: "Sweden",
                region_id: "reg_01JMMHV5RMMT3S092P136WHM92",
                metadata: null,
                created_at: "2025-02-21T15:25:46.979Z",
                updated_at: "2025-02-21T15:25:59.967Z",
                deleted_at: null,
            },
            {
                iso_2: "gb",
                iso_3: "gbr",
                num_code: "826",
                name: "UNITED KINGDOM",
                display_name: "United Kingdom",
                region_id: "reg_01JMMHV5RMMT3S092P136WHM92",
                metadata: null,
                created_at: "2025-02-21T15:25:46.979Z",
                updated_at: "2025-02-21T15:25:59.967Z",
                deleted_at: null,
            },
        ],
    },
    promotions: [],
    payment_collection: {
        id: "pay_col_01JNGBMWHQNYWC74WXGVKS6SPR",
        currency_code: "inr",
        completed_at: null,
        status: "not_paid",
        metadata: null,
        raw_amount: {
            value: "11000",
            precision: 20,
        },
        raw_authorized_amount: null,
        raw_captured_amount: null,
        raw_refunded_amount: null,
        created_at: "2025-03-04T10:36:26.551Z",
        updated_at: "2025-03-04T10:36:26.551Z",
        deleted_at: null,
        payment_sessions: [],
        amount: 11000,
        authorized_amount: null,
        captured_amount: null,
        refunded_amount: null,
    },
};

export const storeCart: HttpTypes.StoreCart = rawStoreCart as unknown as HttpTypes.StoreCart;

export const initiatePaymentContextWithExistingCustomer: InitiatePaymentInput = {
    context: {
        idempotency_key: "payses_01JNGBVGYB3JN2FT03VWAQHENX",
    },
    data: {
        extra: storeCart,
        session_id: EXISTING_SESSION_ID,
    },
    currency_code: "inr",
    amount: 1000,
};

export const initiatePaymentContextWithExistingCustomerRazorpayId: InitiatePaymentInput = {
    currency_code: "inr",
    amount: 1000,
    data: {
        resource_id: "test",
        session_id: "test",
        notes: {
            customer_id: EXISTING_CUSTOMER_ID,
        },
    },
    context: {
        customer: {
            id: EXISTING_CUSTOMER_ID,
            email: EXISTING_CUSTOMER_EMAIL,
            phone: EXISTING_CUSTOMER_CONTACT,
            last_name: "test",
            first_name: "customer",
        },
        account_holder: {
            data: {
                razorpay_id: "TEST-CUSTOMER-ID",
            },
        },
    },
};

export const initiatePaymentContextWithWrongEmail = {
    email: WRONG_CUSTOMER_EMAIL,
    currency_code: "eur",
    amount: 1000,
    resource_id: "test",
    customer: { last_name: "test", first_name: "customer" },
    context: {},
    paymentSessionData: {},
};

export const initiatePaymentContextWithFailIntentCreation = {
    email: EXISTING_CUSTOMER_EMAIL,
    currency_code: "eur",
    amount: 1000,
    resource_id: "test",
    customer: { last_name: "test", first_name: "customer" },
    context: {
        payment_description: "fail",
    },
    paymentSessionData: {},
};

// AUTHORIZE PAYMENT DATA

export const authorizePaymentSuccessData: AuthorizePaymentOutput = {
    status: PaymentSessionStatus.AUTHORIZED,
    data: {
        id: PaymentIntentDataByStatus.ATTEMPTED.id,
    },
};

// CANCEL PAYMENT DATA

export const cancelPaymentSuccessData: CancelPaymentOutput = {
    data: {
        id: PaymentIntentDataByStatus.ATTEMPTED.id,
    },
};

export const cancelPaymentFailData: CancelPaymentOutput = {
    data: {
        id: FAIL_INTENT_ID,
    },
};

export const cancelPaymentPartiallyFailData: CancelPaymentOutput = {
    data: {
        id: PARTIALLY_FAIL_INTENT_ID,
    },
};

// CAPTURE PAYMENT DATA

export const capturePaymentContextSuccessData: CapturePaymentOutput = {
    data: {
        id: PaymentIntentDataByStatus.ATTEMPTED.id,
    },
};

export const capturePaymentContextFailData: CapturePaymentOutput = {
    data: {
        id: FAIL_INTENT_ID,
    },
};

export const capturePaymentContextPartiallyFailData: CapturePaymentOutput = {
    data: {
        id: PARTIALLY_FAIL_INTENT_ID,
    },
};

// DELETE PAYMENT DATA

export const deletePaymentSuccessData: DeletePaymentOutput = {
    data: {
        id: PaymentIntentDataByStatus.ATTEMPTED.id,
    },
};

export const deletePaymentFailData: DeletePaymentOutput = {
    data: {
        id: FAIL_INTENT_ID,
    },
};

export const deletePaymentPartiallyFailData: DeletePaymentOutput = {
    data: {
        id: PARTIALLY_FAIL_INTENT_ID,
    },
};

// REFUND PAYMENT DATA

export const retrievePaymentInput: RefundPaymentInput = {
    amount: 500,
    data: {
        id: PaymentIntentDataByStatus.ATTEMPTED.id,
        session_id: "test",
    },
};

export const refundPaymentSuccessData: RefundPaymentOutput = {
    data: {
        sessionid: PaymentIntentDataByStatus.ATTEMPTED.id,
    },
};

export const refundPaymentFailData: RefundPaymentOutput = {
    data: {
        id: FAIL_INTENT_ID,
    },
};

// RETRIEVE PAYMENT DATA

export const retrievePaymentSuccessData: RetrievePaymentOutput = {
    data: {
        id: PaymentIntentDataByStatus.ATTEMPTED.id,
    },
};

export const retrievePaymentFailData: RetrievePaymentOutput = {
    data: {
        id: FAIL_INTENT_ID,
    },
};

// UPDATE PAYMENT DATA

export const updatePaymentContextWithExistingCustomer = {
    email: EXISTING_CUSTOMER_EMAIL,
    currency_code: "inr",
    amount: 1000,
    resource_id: "test",
    customer: {},
    context: {},
    paymentSessionData: {
        customer: "test",
        amount: 1000,
    },
};

export const updatePaymentContextWithExistingCustomerRazorpayId = {
    email: EXISTING_CUSTOMER_EMAIL,
    currency_code: "inr",
    amount: 1000,
    resource_id: "test",
    customer: {
        metadata: {
            razorpay_id: "test",
        },
    },
    context: {},
    paymentSessionData: {
        customer: "test",
        amount: 1000,
    },
};

export const updatePaymentContextWithWrongEmail = {
    email: WRONG_CUSTOMER_EMAIL,
    currency_code: "inr",
    amount: 1000,
    resource_id: "test",
    customer: {},
    context: {},
    paymentSessionData: {
        customer: "test",
        amount: 1000,
    },
};

export const updatePaymentContextWithDifferentAmount = {
    email: WRONG_CUSTOMER_EMAIL,
    currency_code: "inr",
    amount: 2000,
    resource_id: "test",
    customer: {
        metadata: {
            razorpay_id: "test",
        },
    },
    context: {},
    paymentSessionData: {
        id: PaymentIntentDataByStatus.ATTEMPTED.id,
        customer: "test",
        amount: 1000,
    },
};

export const updatePaymentContextFailWithDifferentAmount = {
    email: WRONG_CUSTOMER_EMAIL,
    currency_code: "inr",
    amount: 2000,
    resource_id: "test",
    customer: {
        metadata: {
            razorpay_id: "test",
        },
    },
    context: {
        metadata: {
            razorpay_id: "test",
        },
    },
    paymentSessionData: {
        id: FAIL_INTENT_ID,
        customer: "test",
        amount: 1000,
    },
};

export const updatePaymentDataWithAmountData = {
    sessionId: RAZORPAY_ID ?? "test",
    amount: 2000,
};

export const updatePaymentDataWithoutAmountData = {
    sessionId: RAZORPAY_ID ?? "test",
    id: RAZORPAY_ID ?? "test", // /duplication needs to be fixed
    /** only notes can be updated */
    notes: {
        customProp: "test",
        test: "test-string",
    },
};

export const updatePaymentDataWithoutAmountDataNoNotes = {
    sessionId: RAZORPAY_ID ?? "test",
    id: RAZORPAY_ID ?? "test", // /duplication needs to be fixed
    /** only notes can be updated */
};
