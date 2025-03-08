import { ModuleProvider, Modules } from "@medusajs/utils";
import { RazorpayProviderService } from "./services";

const services = [RazorpayProviderService];

export default ModuleProvider(Modules.PAYMENT, {
    services,
});
