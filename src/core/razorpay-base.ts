import { Logger } from "@medusajs/medusa";
import Razorpay from "razorpay";
import crypto from "crypto";
import { EOL } from "os";
import { MedusaError, MedusaErrorTypes, MedusaErrorCodes } from "@medusajs/utils";
import {    
    AuthorizePaymentInput,
    AuthorizePaymentOutput,
    CancelPaymentInput,
    CancelPaymentOutput,
    CapturePaymentInput,
    CapturePaymentOutput,
    DeletePaymentInput,
    DeletePaymentOutput,
    GetPaymentStatusInput,
    GetPaymentStatusOutput,
    InitiatePaymentInput,
    InitiatePaymentOutput,
    ProviderWebhookPayload,
    RefundPaymentInput,
    RefundPaymentOutput,
    RetrievePaymentInput,
    RetrievePaymentOutput,
    UpdatePaymentInput,
    UpdatePaymentOutput,
    WebhookActionResult,
    CustomerDTO,
    HttpTypes,
    PaymentProviderOutput,
    PaymentCustomerDTO,
  } from "@medusajs/framework/types";
  import {
    AbstractPaymentProvider,
    isDefined,
    PaymentActions,
    PaymentSessionStatus,
  } from "@medusajs/framework/utils";
import { getAmountFromSmallestUnit } from "../utils/get-smallest-unit";
import { Customers } from "razorpay/dist/types/customers";
import { Orders } from "razorpay/dist/types/orders";
import { Payments } from "razorpay/dist/types/payments";
import { Refunds } from "razorpay/dist/types/refunds";
import {
    Options,
    RazorpayProviderConfig,
    WebhookEventData,
    ErrorCodes,
    PaymentIntentOptions,
    PaymentProviderKeys,
} from "../types";
import { updateRazorpayCustomerMetadataWorkflow } from "../workflows/update-razorpay-customer-metadata";
import { isPaymentProviderError } from "../utils";

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
        if (!this.options_.key_id && this.options_.providers?.length) {
            const provider = this.options_.providers?.find(
                (p) => p.id == RazorpayBase.identifier
            );
            this.options_ = provider?.options as unknown as RazorpayProviderConfig & Options;
        }

        this.init();
    }

    static validateOptions(options: RazorpayProviderConfig & Options): void {
        if (!isDefined(options.key_id)!) {
            throw new Error(
                "Required option `key_id` is missing in Razorpay plugin"
            );
        } else if (!isDefined(options.key_secret)!) {
            throw new Error(
                "Required option `key_secret` is missing in Razorpay plugin"
            );
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
        this.logger.info(`Razorpay options: ${JSON.stringify(this.options_, null, 4)}`);
        this.razorpay_ =
            this.razorpay_ ||
            new Razorpay({
                key_id: this.options_.key_id,
                key_secret: this.options_.key_secret,
                headers: {
                    "Content-Type": "application/json",
                    "X-Razorpay-Account": this.options_.razorpay_account
                }
            });
    }

    abstract get paymentIntentOptions(): PaymentIntentOptions;

    getPaymentIntentOptions(): Partial<PaymentIntentOptions> {
        const options: Partial<PaymentIntentOptions> = {};

        if (this?.paymentIntentOptions?.capture_method) {
            options.capture_method = this.paymentIntentOptions.capture_method;
        }

        if (this?.paymentIntentOptions?.setup_future_usage) {
            options.setup_future_usage =
                this.paymentIntentOptions.setup_future_usage;
        }

        if (this?.paymentIntentOptions?.payment_method_types) {
            options.payment_method_types =
                this.paymentIntentOptions.payment_method_types;
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
        const x = await updateRazorpayCustomerMetadataWorkflow(
            this.container_
        ).run({
            input: {
                medusa_customer_id: customer.id,
                razorpay
            }
        });
        const result = x.result.customer;

        return result;
    }    

    async getRazorpayId(
        intentRequest: Orders.RazorpayOrderCreateRequestBody,
        customer: CustomerDTO
    ): Promise<string | undefined> {
        if (!this._razorpayId) {
            this._razorpayId = intentRequest.notes?.razorpay_id ||
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
                razorpayCustomer = await this.razorpay_.customers.fetch(
                    razorpay_id
                );
            } catch (e) {
                this.logger.error(
                    "unable to fetch customer in the razorpay payment processor"
                );
            }
        }
        return razorpayCustomer;
    }

    async _pollExistingRazorpayCustomer(
        customer: CustomerDTO
    ): Promise<Customers.RazorpayCustomer> {
        let razorpayCustomer: Customers.RazorpayCustomer | undefined = undefined;
        let customerList: Customers.RazorpayCustomer[] = [];

        const count = 10;
        let skip = 0;

        try {
            customerList = (
                await this.razorpay_.customers.all({ count, skip })
            )?.items;
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
            this.logger.error(
                "unable to poll the customer in the razorpay payment processor"
            );
            throw new Error("could not find customer in razorpay");
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

        this._razorpayCustomer = await this._getExistingRazorpayCustomer(
            intentRequest,
            customer
        );

        if (!this._razorpayCustomer) {
            this._razorpayCustomer = await this._pollExistingRazorpayCustomer(customer);
        }

        if (this._razorpayCustomer) {
            const hasRazorpayMetaData = Boolean(
                (customer.metadata as any)?.razorpay_id ||
                (customer.metadata as any)?.razorpay?.rp_customer_id
            );
            if (!hasRazorpayMetaData) {
                await this.updateRazorpayMetadataInCustomer(
                    customer,
                    "rp_customer_id",
                    this._razorpayCustomer.id
                );
                this.logger.debug(
                    `updated customer ${this._razorpayCustomer.email} with RpId :${this._razorpayCustomer.id}`
                );
            }            
        } 

        return this._razorpayCustomer;
    }
    
    async createRazorpayCustomer(
        customer: any,
        intentRequest: any,
        cart: any
    ): Promise<Customers.RazorpayCustomer | undefined> {
        let razorpayCustomer: Customers.RazorpayCustomer;
        const phone =
            customer.phone ??
            cart.billing_address?.phone;

        const gstin = (customer?.metadata?.gstin as string) ?? undefined;        
        if (!phone) {
            throw new Error("phone number to create razorpay customer");
        }
        if (!customer.email) {
            throw new Error("email to create razorpay customer");
        }
        const firstName = customer.first_name ?? "";
        const lastName = customer.last_name ?? "";        

        const customerParams: Customers.RazorpayCustomerCreateRequestBody =
        {
            email: customer.email,
            contact: phone,
            gstin: gstin,
            fail_existing: 0,
            name: `${firstName} ${lastName} `,
            notes: {
                updated_at: new Date().toISOString()
            }
        };

        try {            
            razorpayCustomer = await this.razorpay_.customers.create(
                customerParams
            );
            intentRequest.notes!.razorpay_id = razorpayCustomer?.id;
            if (customer && customer.id) {
                await this.updateRazorpayMetadataInCustomer(
                    customer,
                    "rp_customer_id",
                    razorpayCustomer.id
                );
            }
            return razorpayCustomer;
        } catch (e) {           
            this.logger.error(
                "unable to create customer in the razorpay payment processor: " + JSON.stringify(e, null, 4)
            );
            return;
        }
    }
    
    async updateExistingRazorpayCustomer(
        intentRequest: Orders.RazorpayOrderCreateRequestBody,
        customer: CustomerDTO,        
        storeCart: HttpTypes.StoreCart,        
    ): Promise<Customers.RazorpayCustomer | undefined> {        
        const razorpayCustomer: Customers.RazorpayCustomer | undefined = await this.getRazorpayCustomer(intentRequest, customer);;

        // edit the customer once fetched
        if (razorpayCustomer) {
            const editEmail = customer.email || storeCart?.email;
            const editName =
                `${customer.first_name} ${customer.last_name}`.trim();
            const editPhone = customer?.phone || razorpayCustomer.contact;
            try {
                this._razorpayCustomer =
                    await this.razorpay_.customers.edit(razorpayCustomer.id, {
                        email: editEmail ?? razorpayCustomer.email,
                        contact: editPhone ?? razorpayCustomer.contact!,
                        name: editName != "" ? editName : razorpayCustomer.name
                    });
            } catch (e) {
                this.logger.warn(
                    "unable to edit customer in the razorpay payment processor"
                );
            }
        }
        return this._razorpayCustomer; // returning un modified razorpay customer
    }

    async createOrUpdateRazorpayCustomer(
        intentRequest: Orders.RazorpayOrderCreateRequestBody,
        customer: CustomerDTO,
        storeCart: HttpTypes.StoreCart
    ): Promise<Customers.RazorpayCustomer | undefined> {
        let razorpayCustomer: Customers.RazorpayCustomer | undefined;
        
        razorpayCustomer = await this.getRazorpayCustomer(intentRequest, customer)

        if (razorpayCustomer) {
            this.logger.info(
                "updating the existing customer in razorpay"
            );
            razorpayCustomer = await this.updateExistingRazorpayCustomer(
                intentRequest,
                customer,                
                storeCart,                
            );
        } else {
            this.logger.info("customer doesn't exist in razopay");
            this.logger.info("creating the customer in razopay");

            razorpayCustomer = await this.createRazorpayCustomer(
                customer,
                intentRequest,
                storeCart
            );            
        }

        if (!razorpayCustomer) {
            this.logger.error(
                "unable to poll the customer in the razorpay payment processor"
            );
        }
        return razorpayCustomer;
    }
    
    // helper method for razorpay payments

    _validateSignature(
        razorpay_payment_id: string,
        razorpay_order_id: string,
        razorpay_signature: string
    ): boolean {
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        if (!this.options_.key_id) {
            throw new MedusaError(
                MedusaErrorTypes.INVALID_ARGUMENT,
                "razorpay not configured",
                MedusaErrorCodes.CART_INCOMPATIBLE_STATE
            );
        }
        const expectedSignature = crypto
            .createHmac(
                "sha256",
                this.options_.key_secret ??
                    (this.options_.key_secret as string)
            )
            .update(body.toString())
            .digest("hex");
        return expectedSignature === razorpay_signature;
    }

    async getRazorpayPaymentStatus(
        paymentIntent: Orders.RazorpayOrder,
        attempts: {
            entity: string;
            count: number;
            items: Array<Payments.RazorpayPayment>;
        }
    ): Promise<PaymentSessionStatus> {
        if (!paymentIntent) {
            return PaymentSessionStatus.ERROR;
        } else {
            const authorisedAttempts = attempts.items.filter(
                (i) => i.status == PaymentSessionStatus.AUTHORIZED
            );
            const totalAuthorised = authorisedAttempts.reduce((p, c) => {
                p += parseInt(`${c.amount}`);
                return p;
            }, 0);
            return totalAuthorised == paymentIntent.amount
                ? PaymentSessionStatus.AUTHORIZED
                : PaymentSessionStatus.REQUIRES_MORE;
        }
    }

    async getPaymentStatus(
        data: GetPaymentStatusInput
    ): Promise<GetPaymentStatusOutput> {
        const { data: paymentSessionData } = data;
        const id = paymentSessionData?.id as string;        
        if (!paymentSessionData || !id) {            
            throw this.buildError(
              "No payment intent ID provided while getting payment status",
              new Error("No payment intent ID provided")
            )
          }        
        const orderId = paymentSessionData.order_id as string;
        let paymentIntent: Orders.RazorpayOrder;
        let paymentsAttempted: {
            entity: string;
            count: number;
            items: Array<Payments.RazorpayPayment>;
        };
        try {
            paymentIntent = await this.razorpay_.orders.fetch(id);
            paymentsAttempted = await this.razorpay_.orders.fetchPayments(id);
        } catch (e) {
            this.logger.warn(
                "received payment data from session not order data"
            );
            paymentIntent = await this.razorpay_.orders.fetch(orderId);
            paymentsAttempted = await this.razorpay_.orders.fetchPayments(
                orderId
            );
        }

        switch (paymentIntent.status) {
            // created' | 'authorized' | 'captured' | 'refunded' | 'failed'
            case "created":
                return { status: PaymentSessionStatus.REQUIRES_MORE };

            case "paid":
                return { status: PaymentSessionStatus.AUTHORIZED };

            case "attempted":
                const status = await this.getRazorpayPaymentStatus(
                    paymentIntent,
                    paymentsAttempted
                );
                return { status };

            default:
                return { status: PaymentSessionStatus.PENDING };
        }
    }

    async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
        const { amount, currency_code, data, context } = input;

        if (!data?.extra) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "cart not ready",
                MedusaError.Codes.CART_INCOMPATIBLE_STATE
            );
        }        
        const storeCart: HttpTypes.StoreCart = data.extra as unknown as HttpTypes.StoreCart;                
        const intentRequestData = this.getPaymentIntentOptions();

        let order_data: Orders.RazorpayOrder | undefined = undefined;

        const customerDetails =
            context?.customer ?? (storeCart as any).customer;       

        const phoneNumber = customerDetails.phone ?? storeCart.billing_address?.phone;

        if (!this.options_.key_id) {
            const e = new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "razorpay not configured",
                MedusaError.Codes.CART_INCOMPATIBLE_STATE
            );
            throw this.buildError(
                "An error occurred in InitiatePayment: " + e.message,
                e
            );            
        }

        if (!phoneNumber) {
            const e = new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "no phone number",
                MedusaError.Codes.CART_INCOMPATIBLE_STATE
            );
            throw this.buildError(
                "An error occurred in InitiatePayment: " + e.message,
                e
            );
        }

        const sessionNotes = data?.notes ?? {};
        let toPay = getAmountFromSmallestUnit(
            Math.round(parseInt(amount.toString())),
            currency_code.toUpperCase()
        );
        
        toPay = currency_code.toUpperCase() == "INR" ? toPay * 100 * 100 : toPay;
        
        const intentRequest: Orders.RazorpayOrderCreateRequestBody = {
            amount: toPay,
            currency: currency_code.toUpperCase(),
            notes: {
                ...sessionNotes,
                // resource_id: data?.resource_id as string,
                session_id: data?.session_id as string,
                cart_id: data?.id as string
            },
            payment: {
                capture:
                    this.options_.auto_capture
                        ? "automatic"
                        : "manual",
                capture_options: {
                    refund_speed:
                        this.options_.refund_speed ??
                        "normal",
                    automatic_expiry_period: Math.max(
                        this.options_.automatic_expiry_period ?? 20,
                        12
                    ),
                    manual_expiry_period: Math.max(
                        this.options_.manual_expiry_period ?? 10,
                        7200
                    )
                }
            },
            ...intentRequestData
        };

        this.logger.info(`Razorpay intent request: ${JSON.stringify(intentRequest, null, 4)}`);

        try {
            this.createOrUpdateRazorpayCustomer(
                intentRequest,
                customerDetails,
                storeCart as unknown as HttpTypes.StoreCart
            );
        }
        catch (e) {
            throw this.buildError(
                "An error occurred in InitiatePayment while creating/updating customer data:" + e.message,
                e
            );
        }

        try {
            order_data = await this.razorpay_.orders.create({...intentRequest});
        } catch (e) {
            this.logger.error(`error in creating order: ${JSON.stringify(e, null, 4)}`);
            throw this.buildError(
                "An error occurred in InitiatePayment during the " +
                    "creation of the razorpay payment intent: " +
                    e.message,
                e
            );
        }

        return {
            id: order_data.id,
            data: { ...order_data, intentRequest: intentRequest }
        };
    }

    async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
        const statusResponse = await this.getPaymentStatus(input)
        return statusResponse
    }

    async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {        
        const error = new MedusaError(ErrorCodes.UNSUPPORTED_OPERATION, "An error occurred in cancelPayment",  "Unable to cancel as razorpay doesn't support cancellation");        
        throw this.buildError("An error occurred in cancelPayment", error);
    }

    async capturePayment({
        data: paymentSessionData,
      }: CapturePaymentInput): Promise<CapturePaymentOutput> {
        const order_id = (paymentSessionData as unknown as Orders.RazorpayOrder)
            .id;
        const paymentsResponse = await this.razorpay_.orders.fetchPayments(
            order_id
        );
        const possibleCaptures = paymentsResponse.items?.filter(
            (item) => item.status == "authorized"
        );
        const result = possibleCaptures?.map(async (payment) => {
            const { id, amount, currency } = payment;
            const toPay =
                getAmountFromSmallestUnit(
                    Math.round(parseInt(amount.toString())),
                    currency.toUpperCase()
                ) * 100;
            const paymentIntent = await this.razorpay_.payments.capture(
                id,
                toPay,
                currency as string
            );
            return paymentIntent;
        });
        if (result) {
            const payments = await Promise.all(result);
            const res = payments.reduce(
                (acc, curr) => ((acc[curr.id] = curr), acc),
                {}
            );
            (paymentSessionData as unknown as Orders.RazorpayOrder).payments =
                res;
        }
        return { data: paymentSessionData };
    }

    async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
        return await this.cancelPayment(input)
    }

    async refundPayment({
        amount: refundAmount,
        data,
      }: RefundPaymentInput): Promise<RefundPaymentOutput> {   
        if (!refundAmount) {
            throw this.buildError(
                "No refund amount provided",
                new Error("No refund amount provided")
            )               
        }   

        if (!data) {
            throw this.buildError(
                "No payment intent data provided while refunding payment",
                new Error("No payment intent data provided")
            )   
        }     

        if (!data.id) {
            throw this.buildError(
                "No payment intent ID provided while refunding payment",
                new Error("No payment intent ID provided")
            )
        }    
        
        const id = (data as unknown as Orders.RazorpayOrder).id as string;             
        const paymentList = await this.razorpay_.orders.fetchPayments(id);

        const payment_id = paymentList.items?.find((p) => {
            return (
                parseInt(`${p.amount}`) >= parseInt(refundAmount as string) * 100 &&
                (p.status == "authorized" || p.status == "captured")
            );
        })?.id;
        if (payment_id) {
            const refundRequest = {
                amount: parseInt(refundAmount as string) * 100
            };
            try {
                const refundSession = await this.razorpay_.payments.refund(
                    payment_id,
                    refundRequest
                );
                const refundsIssued =
                    data.refundSessions as Refunds.RazorpayRefund[];
                if (refundsIssued?.length > 0) {
                    refundsIssued.push(refundSession);
                } else {
                    data.refundSessions = [refundSession];
                }
            } catch (e) {
                throw this.buildError("An error occurred in refundPayment", e);
            }
        }
        return { data };
    }

    async retrievePayment({
        data,
      }: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
        let intent;
        try {
            const id = (data as unknown as Orders.RazorpayOrder)
                .id as string;
            intent = await this.razorpay_.orders.fetch(id);
        } catch (e) {
            const id = (
                data as unknown as Payments.RazorpayPayment
            ).order_id as string;
            try {
                intent = await this.razorpay_.orders.fetch(id);
            } catch (e) {
                this.buildError("An error occurred in retrievePayment", e);
            }
        }
        return { data: intent as unknown as Record<string, unknown> }
    }

    async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
        const { amount, currency_code, context } = input;

        if (!context?.customer) {
            throw this.buildError(
              "No customer in context",
              new Error("No customer provided while creating account holder")
            )
        }

        const customer: PaymentCustomerDTO = context.customer;
        const billing_address = customer.billing_address;

        if(!customer.billing_address) {
            throw this.buildError(
                "An error occurred in updatePayment during the retrieve of the cart",
                new Error(
                    "An error occurred in updatePayment during the retrieve of the cart"
                )
            );
        }

        let refreshedCustomer: CustomerDTO;
        let customerPhone = "";
        let razorpayId: string;
        if (customer) {
            try {
                refreshedCustomer = customer as CustomerDTO;
                razorpayId = (refreshedCustomer?.metadata as any)?.razorpay
                    ?.rp_customer_id;
                customerPhone =
                    refreshedCustomer?.phone ?? billing_address?.phone ?? "";
                if (
                    refreshedCustomer?.addresses.length && !refreshedCustomer.addresses.find(
                        (v) => v.id == billing_address?.id
                    )
                ) {
                    this.logger.warn("no customer billing found");
                }
            } catch {
                throw this.buildError(
                    "An error occurred in updatePayment during the retrieve of the customer",
                    new Error(
                        "An error occurred in updatePayment during the retrieve of the customer"
                    )
                );
            }
        }
        const isNonEmptyPhone =
            customerPhone || billing_address?.phone || customer?.phone || "";

        if (!razorpayId!) {
            throw this.buildError(
                "razorpay id not supported",
                new Error("the phone number wasn't specified")
            );
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
            const result = await this.initiatePayment(input);
            if (isPaymentProviderError(result)) {
                throw this.buildError(
                    "An error occurred in updatePayment during the initiate of the new payment for the new customer",
                    result
                );
            }

            return result;
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
                const id = customer.id as string;
                let sessionOrderData: Partial<Orders.RazorpayOrder> = {
                    currency: "INR"
                };
                if (id) {
                    sessionOrderData = (await this.razorpay_.orders.fetch(
                        id
                    )) as Partial<Orders.RazorpayOrder>;
                    delete sessionOrderData.id;
                    delete sessionOrderData.created_at;
                }
                input.currency_code =
                    currency_code?.toUpperCase() ??
                    sessionOrderData?.currency ??
                    "INR";
                const newPaymentSessionOrder = (await this.initiatePayment(
                    input
                ));

                return newPaymentSessionOrder
            } catch (e) {
                throw this.buildError("An error occurred in updatePayment", e);
            }
        }
    }

    async updatePaymentData(
        sessionId: string,
        data: Record<string, unknown>
    ): Promise<UpdatePaymentOutput> {
        // Prevent from updating the amount from here as it should go through
        // the updatePayment method to perform the correct logic
        if (data.amount || data.currency) {
            throw new MedusaError(
                MedusaError.Types.INVALID_DATA,
                "Cannot update amount, use updatePayment instead",
                MedusaError.Types.NOT_ALLOWED
            )
        }
           
        try {
            const paymentSession = await this.razorpay_.payments.fetch(
                (data.data as Record<string, any>).id as string
            );
            if (data.notes || (data.data as any)?.notes) {
                const notes = data.notes || (data.data as any)?.notes;
                const result = (await this.razorpay_.orders.edit(
                    sessionId,
                    {
                        notes: { ...paymentSession.notes, ...notes }
                    }
                )) as unknown as Record<string, any>;
                return { data: result };
            } else {
                this.logger.warn(
                    "only notes can be updated in razorpay order"
                );
                return paymentSession as unknown as UpdatePaymentOutput;
            }
        } catch (e) {
            this.logger.error(
                "unable to update payment data in razorpay: " + JSON.stringify(e, null, 4)
            );
            throw this.buildError("An error occurred in updatePaymentData", e);
        }
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
        return Razorpay.validateWebhookSignature(
            data,
            signature,
            this.options_.webhook_secret,
        );
    }

    protected buildError(
        message: string,
        e: Error
    ): PaymentProviderOutput{
        const error = e as any;
        const errorMessage: string = message ?? error.message ?? "An error occurred";
        const errorCode: string = isPaymentProviderError(e)
            ? error.code
            : "code" in error
            ? error.code
            : ""
        const errorDetail: string = isPaymentProviderError(e)
                ? `${error.error}${EOL}${error.detail ?? ""}`
                : "detail" in e
                ? error.detail
                : error.message ?? ""

        throw new MedusaError(errorMessage, errorCode, errorDetail);
    }
    async getWebhookActionAndData(
        webhookData: ProviderWebhookPayload["payload"]
    ): Promise<WebhookActionResult> {
        const webhookSignature = webhookData.headers["x-razorpay-signature"];

        const webhookSecret =
            this.options_?.webhook_secret ||
            process.env.RAZORPAY_WEBHOOK_SECRET ||
            process.env.RAZORPAY_TEST_WEBHOOK_SECRET;

        this.logger.info(
            `Received Razorpay webhook body as object : ${JSON.stringify(
                webhookData.data
            )}`
        );
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
        const paymentData = (webhookData.data as unknown as WebhookEventData)
            .payload?.payment?.entity;

        const order = await this.razorpay_.orders.fetch(paymentData.order_id);
        /** sometimes this even fires before the order is updated in the remote system */
        const outstanding = getAmountFromSmallestUnit(
            order.amount_paid == 0 ? paymentData.amount : order.amount_paid,
            paymentData.currency.toUpperCase()
        );

        switch (webhookData.data.event) {
            // payment authorization is handled in checkout flow. webhook not needed

            case "payment.captured":
                return {
                    action: PaymentActions.SUCCESSFUL,
                    data: {
                        session_id: (paymentData.notes as any)
                            .session_id as string,
                        amount: outstanding
                    }
                };

            case "payment.authorized":
                return {
                    action: PaymentActions.AUTHORIZED,
                    data: {
                        session_id: (paymentData.notes as any)
                            .session_id as string,
                        amount: outstanding
                    }
                };

            case "payment.failed":
                // TODO: notify customer of failed payment

                return {
                    action: PaymentActions.FAILED,
                    data: {
                        session_id: (paymentData.notes as any)
                            .session_id as string,
                        amount: outstanding
                    }
                };
                break;

            default:
                return { action: PaymentActions.NOT_SUPPORTED };
        }
    }
}

export default RazorpayBase;
