import { AbstractPaymentProvider, isDefined, PaymentActions, PaymentSessionStatus } from "@medusajs/framework/utils";
import { Logger } from "@medusajs/medusa";
import {
    AddressDTO,
    AuthorizePaymentInput,
    AuthorizePaymentOutput,
    CancelPaymentInput,
    CancelPaymentOutput,
    CapturePaymentInput,
    CapturePaymentOutput,
    CustomerDTO,
    DeletePaymentInput,
    DeletePaymentOutput,
    GetPaymentStatusInput,
    GetPaymentStatusOutput,
    HttpTypes,
    InitiatePaymentInput,
    InitiatePaymentOutput,
    PaymentCustomerDTO,
    PaymentProviderOutput,
    ProviderWebhookPayload,
    RefundPaymentInput,
    RefundPaymentOutput,
    RetrievePaymentInput,
    RetrievePaymentOutput,
    UpdatePaymentInput,
    UpdatePaymentOutput,
    WebhookActionResult,
} from "@medusajs/types";
import { MedusaError, MedusaErrorCodes, MedusaErrorTypes } from "@medusajs/utils";
import crypto from "crypto";
import { EOL } from "os";
import Razorpay from "razorpay";
import { Customers } from "razorpay/dist/types/customers";
import { Orders } from "razorpay/dist/types/orders";
import { Payments } from "razorpay/dist/types/payments";
import { Refunds } from "razorpay/dist/types/refunds";
import {
    ErrorCodes,
    Options,
    PaymentIntentOptions,
    PaymentProviderKeys,
    Provider,
    RazorpayProviderConfig,
    WebhookEventData,
} from "../types";
import { isPaymentProviderError } from "../utils";
import { getAmountFromSmallestUnit } from "../utils/get-smallest-unit";
import { updateRazorpayCustomerMetadataWorkflow } from "../workflows/update-razorpay-customer-metadata";

/**
 * The paymentIntent object corresponds to a razorpay order.
 *
 */

abstract class RazorpayBase extends AbstractPaymentProvider<RazorpayProviderConfig & Options> {
    static identifier = PaymentProviderKeys.RAZORPAY;

    protected readonly options_: RazorpayProviderConfig & Options;
    protected razorpay_: Razorpay;
    logger: Logger;
    container_: any;

    private _razorpayCustomer: Customers.RazorpayCustomer | undefined;
    private _razorpayId: string | undefined;

    protected constructor(container: Record<string, unknown>, options: RazorpayProviderConfig & Options) {
        super(container, options);

        this.options_ = options;
        this.logger = container.logger as Logger;

        this.container_ = container;

        // TODO: [github.com/Balu-Varanasi] Fix this later. Not sure why options has no key_id and has providers.
        if (!this.options_.key_id && this.options_.providers?.length) {
            const provider: Provider | undefined = this.options_.providers?.find(
                (p) => p.id == RazorpayBase.identifier
            );
            if (provider) {
                this.options_ = provider?.options as unknown as RazorpayProviderConfig & Options;
            }
        }

        this.init();
    }

    static validateOptions(options: RazorpayProviderConfig & Options): void {
        if (!isDefined(options.key_id)!) {
            throw new Error("Required option `key_id` is missing in Razorpay plugin");
        } else if (!isDefined(options.key_secret)!) {
            throw new Error("Required option `key_secret` is missing in Razorpay plugin");
        }
    }

    protected init(): void {
        if (!this.options_.key_id) {
            throw new MedusaError(
                MedusaErrorTypes.INVALID_ARGUMENT,
                "razorpay not configured",
                MedusaErrorCodes.CART_INCOMPATIBLE_STATE
            );
        }
        this.razorpay_ =
            this.razorpay_ ||
            new Razorpay({
                key_id: this.options_.key_id,
                key_secret: this.options_.key_secret,
                headers: {
                    "Content-Type": "application/json",
                    "X-Razorpay-Account": this.options_.razorpay_account,
                },
            });
    }

    abstract get paymentIntentOptions(): PaymentIntentOptions;

    getPaymentIntentOptions(): Partial<PaymentIntentOptions> {
        const options: Partial<PaymentIntentOptions> = {};

        if (this?.paymentIntentOptions?.capture_method) {
            options.capture_method = this.paymentIntentOptions.capture_method;
        }

        if (this?.paymentIntentOptions?.setup_future_usage) {
            options.setup_future_usage = this.paymentIntentOptions.setup_future_usage;
        }

        if (this?.paymentIntentOptions?.payment_method_types) {
            options.payment_method_types = this.paymentIntentOptions.payment_method_types;
        }

        return options;
    }

    // helper methos to get, create or update razorpay customer

    async updateRazorpayMetadataInCustomer(
        customer: CustomerDTO,
        parameterName: string,
        parameterValue: string
    ): Promise<CustomerDTO> {
        const metadata = customer.metadata;
        let razorpay = metadata?.razorpay as Record<string, string>;
        if (razorpay) {
            razorpay[parameterName] = parameterValue;
        } else {
            razorpay = {};
            razorpay[parameterName] = parameterValue;
        }
        //
        const x = await updateRazorpayCustomerMetadataWorkflow(this.container_).run({
            input: {
                medusa_customer_id: customer.id,
                razorpay,
            },
        });
        const result = x.result.customer;
        return result;
    }

    async getRazorpayId(
        intentRequest: Orders.RazorpayOrderCreateRequestBody,
        customer: CustomerDTO
    ): Promise<string | undefined> {
        if (!this._razorpayId) {
            this._razorpayId =
                intentRequest.notes?.razorpay_id ||
                (customer.metadata as any)?.razorpay_id ||
                (customer.metadata as any)?.razorpay?.rp_customer_id;
        }
        return this._razorpayId;
    }

    async _getExistingRazorpayCustomer(
        intentRequest: Orders.RazorpayOrderCreateRequestBody,
        customer: CustomerDTO
    ): Promise<Customers.RazorpayCustomer | undefined> {
        const razorpay_id = await this.getRazorpayId(intentRequest, customer);
        let razorpayCustomer: Customers.RazorpayCustomer | undefined = undefined;

        if (razorpay_id) {
            try {
                razorpayCustomer = await this.razorpay_.customers.fetch(razorpay_id);
            } catch (e) {
                this.logger.error("unable to fetch customer in the razorpay payment processor");
            }
        }
        return razorpayCustomer;
    }

    async _pollExistingRazorpayCustomer(customer: CustomerDTO): Promise<Customers.RazorpayCustomer> {
        let razorpayCustomer: Customers.RazorpayCustomer | undefined = undefined;
        let customerList: Customers.RazorpayCustomer[] = [];

        const count = 10;
        const skip = 0;

        try {
            const allRazorpayCustomers = await this.razorpay_.customers.all({
                count,
                skip,
            });
            customerList = allRazorpayCustomers?.items;
        } catch (e) {
            this.logger.error(
                "unable to fetch customers in the razorpay payment processor: " + JSON.stringify(e, null, 4)
            );
        }

        for (const customerObj of customerList) {
            if (customerObj.contact === customer.phone || customerObj.email === customer.email) {
                razorpayCustomer = customerObj;
                break;
            }
        }

        if (!customerList.length || !razorpayCustomer) {
            this.logger.error("unable to poll the customer in the razorpay payment processor");
            throw new Error(
                `could not find customer in razorpay: Customer: ${JSON.stringify(
                    customer,
                    null,
                    4
                )} : Customer List: ${JSON.stringify(customerList, null, 4)} : Razorpay Customer: ${JSON.stringify(
                    razorpayCustomer,
                    null,
                    4
                )} : Options: ${JSON.stringify(this.options_, null, 4)}`
            );
        }
        return razorpayCustomer;
    }

    async getRazorpayCustomer(
        intentRequest: Orders.RazorpayOrderCreateRequestBody,
        customer: CustomerDTO
    ): Promise<Customers.RazorpayCustomer | undefined> {
        if (this._razorpayCustomer) {
            return this._razorpayCustomer;
        }

        this._razorpayCustomer = await this._getExistingRazorpayCustomer(intentRequest, customer);

        if (!this._razorpayCustomer) {
            this._razorpayCustomer = await this._pollExistingRazorpayCustomer(customer);
        }

        if (this._razorpayCustomer) {
            const hasRazorpayMetaData = Boolean(
                (customer.metadata as any)?.razorpay_id || (customer.metadata as any)?.razorpay?.rp_customer_id
            );
            if (!hasRazorpayMetaData) {
                await this.updateRazorpayMetadataInCustomer(customer, "rp_customer_id", this._razorpayCustomer.id);
                this.logger.debug(
                    `updated customer ${this._razorpayCustomer.email} with RpId :${this._razorpayCustomer.id}`
                );
            }
        }

        return this._razorpayCustomer;
    }

    async createRazorpayCustomer(
        intentRequest: Orders.RazorpayOrderCreateRequestBody,
        customer: CustomerDTO,
        storeCart: HttpTypes.StoreCart
    ): Promise<Customers.RazorpayCustomer | undefined> {
        const phone = customer.phone ?? storeCart.billing_address?.phone;

        const gstin = (customer?.metadata?.gstin as string) ?? undefined;
        if (!phone) {
            throw new Error("phone number to create razorpay customer");
        }
        if (!customer.email) {
            throw new Error("email to create razorpay customer");
        }
        const firstName = customer.first_name ?? "";
        const lastName = customer.last_name ?? "";

        const customerParams: Customers.RazorpayCustomerCreateRequestBody = {
            email: customer.email,
            contact: phone,
            gstin: gstin,
            fail_existing: 0,
            name: `${firstName} ${lastName} `,
            notes: {
                updated_at: new Date().toISOString(),
            },
        };

        let razorpayCustomer: Customers.RazorpayCustomer | undefined = undefined;
        try {
            razorpayCustomer = await this.razorpay_.customers.create(customerParams);
            intentRequest.notes!.razorpay_id = razorpayCustomer?.id;
            if (customer && customer.id) {
                await this.updateRazorpayMetadataInCustomer(customer, "rp_customer_id", razorpayCustomer.id);
            }
        } catch (e) {
            this.logger.error(
                "unable to create customer in the razorpay payment processor: " + JSON.stringify(e, null, 4)
            );
            return;
        }
        return razorpayCustomer;
    }

    async updateExistingRazorpayCustomer(
        intentRequest: Orders.RazorpayOrderCreateRequestBody,
        customer: CustomerDTO,
        storeCart: HttpTypes.StoreCart
    ): Promise<Customers.RazorpayCustomer | undefined> {
        const razorpayCustomer: Customers.RazorpayCustomer | undefined = await this.getRazorpayCustomer(
            intentRequest,
            customer
        );

        // edit the customer once fetched
        if (razorpayCustomer) {
            const editEmail = customer.email || storeCart?.email;
            const editName = `${customer.first_name} ${customer.last_name}`.trim();
            const editPhone = customer?.phone || razorpayCustomer.contact;
            try {
                this._razorpayCustomer = await this.razorpay_.customers.edit(razorpayCustomer.id, {
                    email: editEmail ?? razorpayCustomer.email,
                    contact: editPhone ?? razorpayCustomer.contact!,
                    name: editName != "" ? editName : razorpayCustomer.name,
                });
            } catch (e) {
                this.logger.warn("unable to edit customer in the razorpay payment processor");
            }
        }
        return this._razorpayCustomer; // returning un modified razorpay customer
    }

    async createOrUpdateRazorpayCustomer(
        intentRequest: Orders.RazorpayOrderCreateRequestBody,
        customer: CustomerDTO,
        storeCart: HttpTypes.StoreCart
    ): Promise<Customers.RazorpayCustomer | undefined> {
        let razorpayCustomer: Customers.RazorpayCustomer | undefined = await this.getRazorpayCustomer(
            intentRequest,
            customer
        );

        if (razorpayCustomer) {
            this.logger.info("updating the existing customer in razorpay");
            razorpayCustomer = await this.updateExistingRazorpayCustomer(intentRequest, customer, storeCart);
        } else {
            this.logger.info("customer doesn't exist in razopay. so, creating a new customer");
            razorpayCustomer = await this.createRazorpayCustomer(intentRequest, customer, storeCart);
        }

        if (!razorpayCustomer) {
            this.logger.error("unable to poll the customer in the razorpay payment processor");
        }
        return razorpayCustomer;
    }

    // helper method for razorpay payments

    _validateSignature(razorpay_payment_id: string, razorpay_order_id: string, razorpay_signature: string): boolean {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        if (!this.options_.key_id) {
            throw new MedusaError(
                MedusaErrorTypes.INVALID_ARGUMENT,
                "razorpay not configured",
                MedusaErrorCodes.CART_INCOMPATIBLE_STATE
            );
        }
        const expectedSignature = crypto
            .createHmac("sha256", this.options_.key_secret ?? (this.options_.key_secret as string))
            .update(body.toString())
            .digest("hex");
        return expectedSignature === razorpay_signature;
    }

    async getRazorpayPaymentStatus(
        razorpayOrder: Orders.RazorpayOrder,
        attempedRazorpayPayments: {
            entity: string;
            count: number;
            items: Array<Payments.RazorpayPayment>;
        }
    ): Promise<PaymentSessionStatus> {
        if (!razorpayOrder) {
            return PaymentSessionStatus.ERROR;
        }

        const authorisedRazorpayPayments: Payments.RazorpayPayment[] = attempedRazorpayPayments.items.filter(
            (i) => i.status == PaymentSessionStatus.AUTHORIZED
        );
        const totalAuthorised: number = authorisedRazorpayPayments.reduce((p, c) => {
            p += parseInt(`${c.amount}`);
            return p;
        }, 0);
        return totalAuthorised == razorpayOrder.amount
            ? PaymentSessionStatus.AUTHORIZED
            : PaymentSessionStatus.REQUIRES_MORE;
    }

    async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
        if (!input.data || !input.data?.id) {
            throw this.buildError(
                "No payment intent ID provided while getting payment status",
                new Error("No payment intent ID provided")
            );
        }
        const id = input.data.id as string;
        const orderId = input.data.order_id as string;
        let razorpayOrder: Orders.RazorpayOrder;
        let attempedRazorpayPayments: {
            entity: string;
            count: number;
            items: Array<Payments.RazorpayPayment>;
        };
        try {
            razorpayOrder = await this.razorpay_.orders.fetch(id);
            attempedRazorpayPayments = await this.razorpay_.orders.fetchPayments(id);
        } catch (e) {
            this.logger.warn("received payment data from session not order data");
            razorpayOrder = await this.razorpay_.orders.fetch(orderId);
            attempedRazorpayPayments = await this.razorpay_.orders.fetchPayments(orderId);
        }

        const paymentStatusResponse: {
            status: PaymentSessionStatus;
        } = {
            status: PaymentSessionStatus.PENDING,
        };
        switch (razorpayOrder.status) {
            // created' | 'authorized' | 'captured' | 'refunded' | 'failed'

            case "created": {
                paymentStatusResponse.status = PaymentSessionStatus.REQUIRES_MORE;
                break;
            }
            case "paid": {
                paymentStatusResponse.status = PaymentSessionStatus.AUTHORIZED;
                break;
            }
            case "attempted": {
                const status = await this.getRazorpayPaymentStatus(razorpayOrder, attempedRazorpayPayments);
                paymentStatusResponse.status = status;
                break;
            }
            default: {
                // default to pending, ignore other statuses
            }
        }
        return paymentStatusResponse;
    }

    async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
        const { amount, currency_code, data, context } = input;

        this.logger.info(`Initiate payment input: ${JSON.stringify(input, null, 4)}`);

        this.logger.info(`Options: ${JSON.stringify(this.options_, null, 4)}`);

        if (!data?.extra) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "cart not ready",
                MedusaError.Codes.CART_INCOMPATIBLE_STATE
            );
        }

        if (!data?.session_id) {
            throw new MedusaError(MedusaError.Types.INVALID_DATA, "Invalid Session", MedusaError.Types.INVALID_DATA);
        }

        const storeCart: HttpTypes.StoreCart = data.extra as unknown as HttpTypes.StoreCart;
        const intentRequestData: Partial<PaymentIntentOptions> = this.getPaymentIntentOptions();

        let order_data: Orders.RazorpayOrder | undefined = undefined;

        const customerDetails = context?.customer ?? (storeCart as any).customer;

        const phoneNumber = customerDetails.phone ?? storeCart.billing_address?.phone;

        if (!this.options_.key_id) {
            const e = new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "razorpay not configured",
                MedusaError.Codes.CART_INCOMPATIBLE_STATE
            );
            throw this.buildError("An error occurred in InitiatePayment: " + e.message, e);
        }

        if (!phoneNumber) {
            const e = new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "no phone number",
                MedusaError.Codes.CART_INCOMPATIBLE_STATE
            );
            throw this.buildError("An error occurred in InitiatePayment: " + e.message, e);
        }

        const sessionNotes = data?.notes ?? {};
        let toPay = getAmountFromSmallestUnit(Math.round(parseInt(amount.toString())), currency_code.toUpperCase());

        toPay = currency_code.toUpperCase() == "INR" ? toPay * 100 * 100 : toPay;

        const intentRequest: Orders.RazorpayOrderCreateRequestBody = {
            amount: toPay,
            currency: currency_code.toUpperCase(),
            notes: {
                ...sessionNotes,
                // resource_id: data?.resource_id as string,
                session_id: data.session_id as string,
                cart_id: storeCart.id as string,
            },
            payment: {
                capture: this.options_.auto_capture ? "automatic" : "manual",
                capture_options: {
                    refund_speed: this.options_.refund_speed ?? "normal",
                    automatic_expiry_period: Math.max(this.options_.automatic_expiry_period ?? 20, 12),
                    manual_expiry_period: Math.max(this.options_.manual_expiry_period ?? 10, 7200),
                },
            },
            ...intentRequestData,
        };

        try {
            this.createOrUpdateRazorpayCustomer(
                intentRequest,
                customerDetails,
                storeCart as unknown as HttpTypes.StoreCart
            );
        } catch (e) {
            throw this.buildError(
                "An error occurred in InitiatePayment while creating/updating customer data:" + e.message,
                e
            );
        }

        try {
            order_data = await this.razorpay_.orders.create({
                ...intentRequest,
            });
        } catch (e) {
            throw this.buildError(
                "An error occurred in InitiatePayment during the " +
                    "creation of the razorpay payment intent: " +
                    e.message,
                e
            );
        }

        const output: InitiatePaymentOutput = {
            id: order_data.id,
            data: { ...order_data, intentRequest: intentRequest },
        };
        return output;
    }

    async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
        const statusResponse = await this.getPaymentStatus(input);
        return statusResponse;
    }

    async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
        const error = new MedusaError(
            ErrorCodes.UNSUPPORTED_OPERATION,
            "An error occurred in cancelPayment",
            "Unable to cancel as razorpay doesn't support cancellation"
        );
        throw this.buildError("An error occurred in cancelPayment", error);
    }

    async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
        const razorpayOrder: Orders.RazorpayOrder = input.data as unknown as Orders.RazorpayOrder;
        const razorpayOrderPayments: {
            entity: string;
            count: number;
            items: Array<Payments.RazorpayPayment>;
        } = await this.razorpay_.orders.fetchPayments(razorpayOrder.id);
        const possibleRazorpayPaymentCaptures: Payments.RazorpayPayment[] = razorpayOrderPayments.items?.filter(
            (item) => item.status == "authorized"
        );
        const result = possibleRazorpayPaymentCaptures?.map(async (possibleRazorpayPaymentCapture) => {
            const { id, amount, currency } = possibleRazorpayPaymentCapture;
            const toPay =
                getAmountFromSmallestUnit(Math.round(parseInt(amount.toString())), currency.toUpperCase()) * 100;
            const paymentCapture: Payments.RazorpayPayment = await this.razorpay_.payments.capture(
                id,
                toPay,
                currency as string
            );
            return paymentCapture;
        });
        if (result) {
            const payments = await Promise.all(result);
            const res = payments.reduce((acc, curr) => ((acc[curr.id] = curr), acc), {});
            razorpayOrder.payments = res;
        }

        const capturePaymentOutput: CapturePaymentOutput = {
            data: razorpayOrder as unknown as Record<string, unknown>,
        };
        return capturePaymentOutput;
    }

    async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
        return await this.cancelPayment(input);
    }

    async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
        if (!input.amount) {
            throw this.buildError("No refund amount provided", new Error("No refund amount provided"));
        }

        if (!input.data) {
            throw this.buildError(
                "No payment intent data provided while refunding payment",
                new Error("No payment intent data provided")
            );
        }

        if (!input.data.id) {
            throw this.buildError(
                "No payment intent ID provided while refunding payment",
                new Error("No payment intent ID provided")
            );
        }
        const razorpayOrder: Orders.RazorpayOrder = input.data as unknown as Orders.RazorpayOrder;
        const id: string = razorpayOrder.id as string;
        const razorpayOrderPayments: {
            entity: string;
            count: number;
            items: Array<Payments.RazorpayPayment>;
        } = await this.razorpay_.orders.fetchPayments(id);

        const filteredRazorpayPaymentToRefund: Payments.RazorpayPayment | undefined = razorpayOrderPayments.items?.find(
            (p) => {
                return (
                    parseInt(`${p.amount}`) >= parseInt(input.amount as string) * 100 &&
                    (p.status == "authorized" || p.status == "captured")
                );
            }
        );
        if (filteredRazorpayPaymentToRefund?.id) {
            const refundRequest = {
                amount: parseInt(input.amount as string) * 100,
            };
            try {
                const refundSession: Refunds.RazorpayRefund = await this.razorpay_.payments.refund(
                    filteredRazorpayPaymentToRefund.id as string,
                    refundRequest
                );
                const refundsIssued: Refunds.RazorpayRefund[] = input.data.refundSessions as Refunds.RazorpayRefund[];

                if (refundsIssued?.length > 0) {
                    refundsIssued.push(refundSession);
                } else {
                    input.data.refundSessions = [refundSession];
                }
            } catch (e) {
                throw this.buildError("An error occurred in refundPayment", e);
            }
        }

        const refundPaymentOutput: RefundPaymentOutput = {
            data: input.data as unknown as Record<string, unknown>,
        };
        return refundPaymentOutput;
    }

    async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
        const data: Record<string, unknown> = input.data as Record<string, unknown>;
        let razorpayOrderIntent: Orders.RazorpayOrder | undefined = undefined;

        if (!data.id) {
            throw this.buildError(
                "No payment intent ID provided while retrieving payment",
                new Error("No payment intent ID provided")
            );
        }
        try {
            razorpayOrderIntent = await this.razorpay_.orders.fetch(data.id as string);
        } catch (e) {
            const orderId = (data as unknown as Payments.RazorpayPayment).order_id as string;
            try {
                razorpayOrderIntent = await this.razorpay_.orders.fetch(orderId);
            } catch (e) {
                this.buildError("An error occurred in retrievePayment", e);
            }
        }
        const retrievePaymentOutput: RetrievePaymentOutput = {
            data: razorpayOrderIntent as unknown as Record<string, unknown>,
        };
        return retrievePaymentOutput;
    }

    async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
        const { amount, currency_code, context } = input;

        if (!context?.customer) {
            throw this.buildError(
                "No customer in context",
                new Error("No customer provided while creating account holder")
            );
        }

        if (!context?.customer?.billing_address) {
            throw this.buildError(
                "An error occurred in updatePayment during the retrieve of the cart",
                new Error("An error occurred in updatePayment during the retrieve of the cart")
            );
        }

        const customer: PaymentCustomerDTO = context.customer;
        const customerId: string = customer.id as string;
        const billing_address: Partial<AddressDTO> | null = customer.billing_address ?? null;

        let refreshedCustomer: CustomerDTO;
        let customerPhone = "";
        let razorpayId: string;

        let initiatePaymentOutput: InitiatePaymentOutput;

        try {
            refreshedCustomer = customer as CustomerDTO;
            razorpayId = (refreshedCustomer?.metadata as any)?.razorpay?.rp_customer_id;
            customerPhone = refreshedCustomer?.phone ?? billing_address?.phone ?? "";
            if (
                refreshedCustomer?.addresses.length &&
                !refreshedCustomer.addresses.find((v) => v.id == billing_address?.id)
            ) {
                this.logger.warn("no customer billing found");
            }
        } catch {
            throw this.buildError(
                "An error occurred in updatePayment during the retrieve of the customer",
                new Error("An error occurred in updatePayment during the retrieve of the customer")
            );
        }

        const isNonEmptyPhone: string = customerPhone || billing_address?.phone || customer?.phone || "";

        if (!razorpayId!) {
            throw this.buildError("razorpay id not supported", new Error("the phone number wasn't specified"));
        }

        if (razorpayId !== (customer as any)?.id) {
            const phone = isNonEmptyPhone;

            if (!phone) {
                this.logger.warn("phone number wasn't specified");
                throw this.buildError(
                    "An error occurred in updatePayment during the retrieve of the customer",
                    new Error("the phone number wasn't specified")
                );
            }
            initiatePaymentOutput = await this.initiatePayment(input);

            if (isPaymentProviderError(initiatePaymentOutput)) {
                throw this.buildError(
                    "An error occurred in updatePayment during the initiate of the new payment for the new customer",
                    initiatePaymentOutput
                );
            }
        } else {
            if (!amount) {
                throw this.buildError(
                    "amount  not valid",
                    new MedusaError(
                        MedusaErrorTypes.INVALID_DATA,
                        "amount  not valid",
                        MedusaErrorCodes.CART_INCOMPATIBLE_STATE
                    )
                );
            }
            if (!currency_code) {
                throw this.buildError(
                    "currency code not known",
                    new MedusaError(
                        MedusaErrorTypes.INVALID_DATA,
                        "currency code unknown",
                        MedusaErrorCodes.CART_INCOMPATIBLE_STATE
                    )
                );
            }

            try {
                let partialSessionRazorpayOrder: Partial<Orders.RazorpayOrder> = {
                    currency: "INR",
                };
                if (customerId) {
                    partialSessionRazorpayOrder = (await this.razorpay_.orders.fetch(
                        customerId
                    )) as Partial<Orders.RazorpayOrder>;
                    delete partialSessionRazorpayOrder.id;
                    delete partialSessionRazorpayOrder.created_at;
                }
                input.currency_code = currency_code?.toUpperCase() ?? partialSessionRazorpayOrder?.currency ?? "INR";
                initiatePaymentOutput = await this.initiatePayment(input);
            } catch (e) {
                throw this.buildError("An error occurred in updatePayment", e);
            }
        }
        return initiatePaymentOutput;
    }

    async updatePaymentData(sessionId: string, data: Record<string, unknown>): Promise<UpdatePaymentOutput> {
        // Prevent from updating the amount from here as it should go through
        // the updatePayment method to perform the correct logic
        if (data.amount || data.currency) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Cannot update amount, use updatePayment instead",
                MedusaError.Types.NOT_ALLOWED
            );
        }

        let razorpayPaymentOutput: UpdatePaymentOutput;

        try {
            const razorpayPaymentId: string = (data.data as Record<string, any>).id as string;
            const razorpayPayment: Payments.RazorpayPayment = await this.razorpay_.payments.fetch(razorpayPaymentId);
            if (data.notes || (data.data as any)?.notes) {
                const notes = data.notes || (data.data as any)?.notes;
                const editedRazorpayOrder: Orders.RazorpayOrder = await this.razorpay_.orders.edit(sessionId, {
                    notes: { ...razorpayPayment.notes, ...notes },
                });
                razorpayPaymentOutput = {
                    data: editedRazorpayOrder as Record<string, any>,
                } as UpdatePaymentOutput;
            } else {
                this.logger.warn("only notes can be updated in razorpay order");
                razorpayPaymentOutput = razorpayPayment as unknown as UpdatePaymentOutput;
            }
        } catch (e) {
            this.logger.error("unable to update payment data in razorpay: " + JSON.stringify(e, null, 4));
            throw this.buildError("An error occurred in updatePaymentData", e);
        }
        return razorpayPaymentOutput;
    }
    /*
  /**
   * Constructs Razorpay Webhook event
   * @param {object} data - the data of the webhook request: req.body
   * @param {object} signature - the Razorpay signature on the event, that
   *    ensures integrity of the webhook event
   * @return {object} Razorpay Webhook event
   */

    constructWebhookEvent(data, signature): boolean {
        if (!this.options_.key_id) {
            throw new MedusaError(
                MedusaErrorTypes.INVALID_ARGUMENT,
                "razorpay not configured",
                MedusaErrorCodes.CART_INCOMPATIBLE_STATE
            );
        }
        const isValidWebhookSignature = Razorpay.validateWebhookSignature(
            data,
            signature,
            this.options_.webhook_secret
        );
        return isValidWebhookSignature;
    }

    protected buildError(message: string, e: Error): PaymentProviderOutput {
        const error = e as any;
        const errorMessage: string = message ?? error.message ?? "An error occurred";
        const errorCode: string = isPaymentProviderError(e) ? error.code : "code" in error ? error.code : "";
        const errorDetail: string = isPaymentProviderError(e)
            ? `${error.error}${EOL}${error.detail ?? ""}`
            : "detail" in e
            ? error.detail
            : error.message ?? "";

        throw new MedusaError(errorMessage, errorCode, errorDetail);
    }
    async getWebhookActionAndData(webhookData: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
        const webhookSignature = webhookData.headers["x-razorpay-signature"];

        const webhookSecret =
            this.options_?.webhook_secret ||
            process.env.RAZORPAY_WEBHOOK_SECRET ||
            process.env.RAZORPAY_TEST_WEBHOOK_SECRET;
        try {
            const validationResponse = Razorpay.validateWebhookSignature(
                webhookData.rawData.toString(),
                webhookSignature as string,
                webhookSecret!
            );
            // return if validation fails
            if (!validationResponse) {
                return { action: PaymentActions.FAILED };
            }
        } catch (error) {
            this.logger.error(`Razorpay webhook validation failed : ${JSON.stringify(error, null, 4)}`);

            return { action: PaymentActions.FAILED };
        }
        const paymentData = (webhookData.data as unknown as WebhookEventData).payload?.payment?.entity;

        const order = await this.razorpay_.orders.fetch(paymentData.order_id);
        /** sometimes this even fires before the order is updated in the remote system */
        const outstanding = getAmountFromSmallestUnit(
            order.amount_paid == 0 ? paymentData.amount : order.amount_paid,
            paymentData.currency.toUpperCase()
        );

        let webhookActionResult: WebhookActionResult;

        switch (webhookData.data.event) {
            // payment authorization is handled in checkout flow. webhook not needed

            case "payment.captured": {
                webhookActionResult = {
                    action: PaymentActions.SUCCESSFUL,
                    data: {
                        session_id: (paymentData.notes as any).session_id as string,
                        amount: outstanding,
                    },
                };
            }
            case "payment.authorized": {
                webhookActionResult = {
                    action: PaymentActions.AUTHORIZED,
                    data: {
                        session_id: (paymentData.notes as any).session_id as string,
                        amount: outstanding,
                    },
                };
            }

            case "payment.failed": {
                // TODO: notify customer of failed payment

                webhookActionResult = {
                    action: PaymentActions.FAILED,
                    data: {
                        session_id: (paymentData.notes as any).session_id as string,
                        amount: outstanding,
                    },
                };
                break;
            }
            default: {
                webhookActionResult = { action: PaymentActions.NOT_SUPPORTED };
            }
        }
        return webhookActionResult;
    }
}

export default RazorpayBase;
