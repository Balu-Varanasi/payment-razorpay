import RazorpayBase from "../razorpay-base";
import { PaymentIntentOptions, RazorpayProviderConfig, Options } from "../../types";

export class RazorpayTest extends RazorpayBase {
    constructor(_:  Record<string, unknown>, options: RazorpayProviderConfig & Options) {
        super(_, options);
    }

    get paymentIntentOptions(): PaymentIntentOptions {
        return {
            amount: 100,
            currency: "inr"
        };
    }
}
