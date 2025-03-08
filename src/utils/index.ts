export function isPaymentProviderError(obj: any): obj is Error {
    return obj && typeof obj === "object" && "error" in obj && "code" in obj && "detail" in obj;
}
