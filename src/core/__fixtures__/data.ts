// import { AuthorizePaymentOutput, CancelPaymentOutput, CapturePaymentOutput, DeletePaymentOutput, HttpTypes, InitiatePaymentInput, RefundPaymentOutput, RetrievePaymentOutput } from "@medusajs/framework/types";
// import {
//     EXISTING_CUSTOMER_ID,
//     EXISTING_CUSTOMER_EMAIL,
//     EXISTING_CUSTOMER_CONTACT,
//     FAIL_INTENT_ID,
//     PARTIALLY_FAIL_INTENT_ID,
//     RAZORPAY_ID,
//     WRONG_CUSTOMER_EMAIL,
// } from "../__mocks__/razorpay";
// import { PaymentSessionStatus } from "@medusajs/framework/utils";

// export const PaymentIntentDataByStatus = {
//     ATTEMPTED: {
//         id: EXISTING_CUSTOMER_ID,
//     },
//     SUCCEEDED: {
//         id: EXISTING_CUSTOMER_ID,
//     },
//     CANCELED: {
//         id: EXISTING_CUSTOMER_ID,
//     },
//     FAILED: {
//         id: EXISTING_CUSTOMER_ID,
//     },
//     UNKNOWN: {
//         id: EXISTING_CUSTOMER_ID,
//     },
//     CREATED: {
//         id: EXISTING_CUSTOMER_ID,
//     }
// };
// // INITIATE PAYMENT DATA

// export const STORE_CART: any = {
//     id: 'cart_01JMVM3592WMZBXJ7H7P06V665',
//     currency_code: 'eur',
//     email: EXISTING_CUSTOMER_EMAIL,
//     region_id: 'reg_01JMMHV5RMMT3S092P136WHM92',
//     created_at: '2025-02-24T09:19:59.778Z',
//     updated_at: '2025-02-27T12:54:47.383Z',
//     completed_at: null,
//     total: 20,
//     subtotal: 20,
//     tax_total: 0,
//     discount_total: 0,
//     discount_subtotal: 0,
//     discount_tax_total: 0,
//     original_total: 20,
//     original_tax_total: 0,
//     item_total: 10,
//     item_subtotal: 10,
//     item_tax_total: 0,
//     original_item_total: 10,
//     original_item_subtotal: 10,
//     original_item_tax_total: 0,
//     shipping_total: 10,
//     shipping_subtotal: 10,
//     shipping_tax_total: 0,
//     original_shipping_tax_total: 0,
//     original_shipping_subtotal: 10,
//     original_shipping_total: 10,
//     metadata: null,
//     sales_channel_id: 'sc_01JMMHV081NZ7R165WK9G077T0',
//     shipping_address_id: 'caaddr_01JN3QJKTPE8ARQ6B8H79XBD8H',
//     billing_address_id: 'caaddr_01JN3QJKTPRFXK4G2XJQJYB9Y8',
//     customer_id: 'cus_01JMW6SDES9T1SNEMTJFNFGYAK',
//     items: [
//       {
//         id: 'cali_01JMVM35QDRJ2ZDDMTR9QJ7HDX',
//         title: 'L',
//         subtitle: 'Medusa Sweatshirt',
//         thumbnail: 'https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png',
//         quantity: 1,
//         variant_id: 'variant_01JMMHV637E12DQCTPES8GM9RW',
//         product_id: 'prod_01JMMHV5ZTVVKJ61BJHR3CWR9P',
//         product_title: 'Medusa Sweatshirt',
//         product_description: 'Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.',
//         product_handle: 'sweatshirt',
//         variant_sku: 'SWEATSHIRT-L',
//         variant_title: 'L',
//         requires_shipping: true,
//         is_discountable: true,
//         is_tax_inclusive: false,
//         metadata: {},
//         cart_id: 'cart_01JMVM3592WMZBXJ7H7P06V665',
//         adjustments: [],
//         tax_lines: [],
//         unit_price: 10,
//         subtotal: 10,
//         total: 10,
//         original_total: 10,
//         discount_total: 0,
//         discount_tax_total: 0,
//         tax_total: 0,
//         original_tax_total: 0,
//         product: {
//             id: 'prod_01JMMHV5ZTVVKJ61BJHR3CWR9P',
//             title: 'Medusa Sweatshirt',
//             handle: 'sweatshirt',
//             subtitle: null,
//             description: 'Reimagine the feeling of a classic sweatshirt. With our cotton sweatshirt, everyday essentials no longer have to be ordinary.',
//             is_giftcard: false,
//             status: 'published',
//             thumbnail: 'https://medusa-public-images.s3.eu-west-1.amazonaws.com/sweatshirt-vintage-front.png',
//             length: null,
//             height: null,
//             width: null,
//             origin_country: null,
//             hs_code: null,
//             mid_code: null,
//             material: null,
//             discountable: true,
//             external_id: null,
//             metadata: null,
//             type_id: null,
//             type: null,
//             collection_id: null,
//             collection: null,
//             created_at: '2025-02-21T15:26:00.171Z',
//             updated_at: '2025-02-21T15:26:00.171Z',
//             deleted_at: null,
//             tags: [],
//             categories: [],
//             variants: [],
//             options: [],
//             images: [],
//             weight: 400,
//         },
//         variant: {
//             id: 'variant_01JMMHV637E12DQCTPES8GM9RW',
//             title: 'L',
//             sku: 'SWEATSHIRT-L',
//             barcode: null,
//             ean: null,
//             upc: null,
//             allow_backorder: false,
//             manage_inventory: true,
//             hs_code: null,
//             origin_country: null,
//             mid_code: null,
//             material: null,
//             weight: null,
//             length: null,
//             height: null,
//             width: null,
//             metadata: null,
//             variant_rank: 0,
//             product_id: 'prod_01JMMHV5ZTVVKJ61BJHR3CWR9P',
//             product: {} as any,
//             created_at: '2025-02-21T15:26:00.299Z',
//             updated_at: '2025-02-21T15:26:00.299Z',
//             deleted_at: null,
//             options: [],
//         },
//       }
//     ],
//     shipping_methods: [],
//     shipping_address: {
//         id: 'caaddr_01JN3QJKTPE8ARQ6B8H79XBD8H',
//         first_name: 'Balu',
//         last_name: 'Varanasi',
//         company: '',
//         address_1: 'Flat Number, Apartment, Street Name',
//         address_2: '',
//         city: 'Test Country',
//         postal_code: '500049',
//         country_code: 'fr',
//         province: 'Test Province',
//         phone: EXISTING_CUSTOMER_CONTACT,
//         created_at: '2025-02-24T09:19:59.778Z',
//         updated_at: '2025-02-24T09:19:59.778Z',
//     },
//     billing_address: {
//         id: 'caaddr_01JN3QJKTPRFXK4G2XJQJYB9Y8',
//         first_name: 'Balu',
//         last_name: 'Varanasi',
//         company: '',
//         address_1: 'Flat Number, Apartment, Street Name',
//         address_2: '',
//         city: 'Test Country',
//         postal_code: '500049',
//         country_code: 'fr',
//         province: 'Test Province',
//         phone: EXISTING_CUSTOMER_CONTACT,
//         created_at: '2025-02-24T09:19:59.778Z',
//         updated_at: '2025-02-24T09:19:59.778Z',      
//     },
//     customer: {
//       id: EXISTING_CUSTOMER_ID,
//       email: EXISTING_CUSTOMER_EMAIL,
//       groups: []
//     },
//     region: {
//       id: 'reg_01JMMHV5RMMT3S092P136WHM92',
//       name: 'Europe',
//       currency_code: 'eur',
//       automatic_taxes: true,
//       metadata: null,
//       created_at: '2025-02-21T15:25:59.966Z',
//       updated_at: '2025-02-21T15:25:59.966Z',
//       deleted_at: null,
//       countries: [
//         {
//           iso_2: 'dk',
//           iso_3: 'dnk',
//           num_code: '208',
//           name: 'DENMARK',
//           display_name: 'Denmark',
//           region_id: 'reg_01JMMHV5RMMT3S092P136WHM92',
//           metadata: null,
//           created_at: '2025-02-21T15:25:46.976Z',
//           updated_at: '2025-02-21T15:25:59.967Z',
//           deleted_at: null
//         },
//         {
//           iso_2: 'fr',
//           iso_3: 'fra',
//           num_code: '250',
//           name: 'FRANCE',
//           display_name: 'France',
//           region_id: 'reg_01JMMHV5RMMT3S092P136WHM92',
//           metadata: null,
//           created_at: '2025-02-21T15:25:46.977Z',
//           updated_at: '2025-02-21T15:25:59.967Z',
//           deleted_at: null
//         },
//         {
//           iso_2: 'de',
//           iso_3: 'deu',
//           num_code: '276',
//           name: 'GERMANY',
//           display_name: 'Germany',
//           region_id: 'reg_01JMMHV5RMMT3S092P136WHM92',
//           metadata: null,
//           created_at: '2025-02-21T15:25:46.977Z',
//           updated_at: '2025-02-21T15:25:59.967Z',
//           deleted_at: null
//         },
//         {
//           iso_2: 'it',
//           iso_3: 'ita',
//           num_code: '380',
//           name: 'ITALY',
//           display_name: 'Italy',
//           region_id: 'reg_01JMMHV5RMMT3S092P136WHM92',
//           metadata: null,
//           created_at: '2025-02-21T15:25:46.977Z',
//           updated_at: '2025-02-21T15:25:59.967Z',
//           deleted_at: null
//         },
//         {
//           iso_2: 'es',
//           iso_3: 'esp',
//           num_code: '724',
//           name: 'SPAIN',
//           display_name: 'Spain',
//           region_id: 'reg_01JMMHV5RMMT3S092P136WHM92',
//           metadata: null,
//           created_at: '2025-02-21T15:25:46.979Z',
//           updated_at: '2025-02-21T15:25:59.967Z',
//           deleted_at: null
//         },
//         {
//           iso_2: 'se',
//           iso_3: 'swe',
//           num_code: '752',
//           name: 'SWEDEN',
//           display_name: 'Sweden',
//           region_id: 'reg_01JMMHV5RMMT3S092P136WHM92',
//           metadata: null,
//           created_at: '2025-02-21T15:25:46.979Z',
//           updated_at: '2025-02-21T15:25:59.967Z',
//           deleted_at: null
//         },
//         {
//           iso_2: 'gb',
//           iso_3: 'gbr',
//           num_code: '826',
//           name: 'UNITED KINGDOM',
//           display_name: 'United Kingdom',
//           region_id: 'reg_01JMMHV5RMMT3S092P136WHM92',
//           metadata: null,
//           created_at: '2025-02-21T15:25:46.979Z',
//           updated_at: '2025-02-21T15:25:59.967Z',
//           deleted_at: null
//         }
//       ],
//     },
//     promotions: [],
//     payment_collection: {
//       id: 'pay_col_01JMVRX81E6P7QEY3GWQCFB4G3',
//       currency_code: 'eur',
//       completed_at: null,
//       status: 'not_paid',
//       metadata: null,
//       raw_amount: { value: '20', precision: 20 },
//       raw_authorized_amount: null,
//       raw_captured_amount: null,
//       raw_refunded_amount: null,
//       created_at: '2025-02-24T10:44:08.878Z',
//       updated_at: '2025-02-24T10:44:08.878Z',
//       deleted_at: null,
//       payment_sessions: [
//         {
//             id: 'payses_01JN3QDYRPMYBSDRMFKXE1TYXW',
//             currency_code: 'eur',
//             provider_id: 'pp_system_default',
//             data: {},
//             context: {
//               customer: {
//                 id: EXISTING_CUSTOMER_ID,
//                 email: EXISTING_CUSTOMER_EMAIL,
//                 phone: EXISTING_CUSTOMER_CONTACT,
//                 metadata: null,
//                 addresses: [],
//                 last_name: 'Varanasi',
//                 first_name: 'Balu',
//                 company_name: null
//               }
//             },
//             status: 'pending',
//             authorized_at: null,
//             payment_collection_id: 'pay_col_01JMVRX81E6P7QEY3GWQCFB4G3',
//             metadata: null,
//             raw_amount: { value: '20', precision: 20 },
//             created_at: '2025-02-27T12:52:14.743Z',
//             updated_at: '2025-02-27T12:52:14.743Z',
//             deleted_at: null,
//             amount: 20
//         }
//       ],
//       amount: 20,
//       authorized_amount: null,
//       captured_amount: null,
//       refunded_amount: null
//     }
// }


// export const initiatePaymentContextWithExistingCustomer: InitiatePaymentInput = {
//     currency_code: "inr",
//     amount: 1000,
//     data: {
//         resource_id: "test",
//         session_id: "test"
//     },
//     context: {
//         customer: {
//             id: "TEST-CUSTOMER",
//             last_name: "test",
//             first_name: "customer",
//             phone: EXISTING_CUSTOMER_CONTACT,
//             email: EXISTING_CUSTOMER_EMAIL,
//         },        
//     },
// };

// export const initiatePaymentContextWithExistingCustomerRazorpayId: InitiatePaymentInput = {
//     currency_code: "inr",
//     amount: 1000,
//     data: {
//         resource_id: "test",
//         session_id: "test"
//     },    
//     context: {
//         customer: {
//             id: EXISTING_CUSTOMER_ID,
//             email: EXISTING_CUSTOMER_EMAIL,
//             phone: EXISTING_CUSTOMER_CONTACT,
//             last_name: "test",
//             first_name: "customer",
//         },
//         account_holder: {
//             data: {
//                 razorpay_id: "TEST-CUSTOMER-ID",
//             },
//         }
//     },
//     data: {
//         notes: {
//             customer_id: "TEST-CUSTOMER"
//         }
//     }
// };

// export const initiatePaymentContextWithWrongEmail = {
//     email: WRONG_CUSTOMER_EMAIL,
//     currency_code: "eur",
//     amount: 1000,
//     resource_id: "test",
//     customer: { last_name: "test", first_name: "customer" },
//     context: {},
//     paymentSessionData: {}
// };

// export const initiatePaymentContextWithFailIntentCreation = {
//     email: EXISTING_CUSTOMER_EMAIL,
//     currency_code: "eur",
//     amount: 1000,
//     resource_id: "test",
//     customer: { last_name: "test", first_name: "customer" },
//     context: {
//         payment_description: "fail"
//     },
//     paymentSessionData: {}
// };

// // AUTHORIZE PAYMENT DATA

// export const authorizePaymentSuccessData: AuthorizePaymentOutput = {
//     status: PaymentSessionStatus.AUTHORIZED,
//     data: {
//         id: PaymentIntentDataByStatus.ATTEMPTED.id,
//     }
// };

// // CANCEL PAYMENT DATA

// export const cancelPaymentSuccessData: CancelPaymentOutput = {
//     data: {
//         id: PaymentIntentDataByStatus.ATTEMPTED.id
//     },
// };

// export const cancelPaymentFailData: CancelPaymentOutput = {
//     data: {
//         id: FAIL_INTENT_ID
//     },
// };

// export const cancelPaymentPartiallyFailData: CancelPaymentOutput = {
//     data: {
//         id: PARTIALLY_FAIL_INTENT_ID
//     },
// };

// // CAPTURE PAYMENT DATA

// export const capturePaymentContextSuccessData: CapturePaymentOutput = {
//     data: {
//         id: PaymentIntentDataByStatus.ATTEMPTED.id
//     },
// };

// export const capturePaymentContextFailData: CapturePaymentOutput = {
//     data: {
//         id: FAIL_INTENT_ID
//     }
// };

// export const capturePaymentContextPartiallyFailData: CapturePaymentOutput = {
//     data: {
//         id: PARTIALLY_FAIL_INTENT_ID
//     }
// };

// // DELETE PAYMENT DATA

// export const deletePaymentSuccessData: DeletePaymentOutput = {
//     data: {
//         id: PaymentIntentDataByStatus.ATTEMPTED.id
//     }
// };

// export const deletePaymentFailData: DeletePaymentOutput = {
//     data: {
//         id: FAIL_INTENT_ID
//     }
// };

// export const deletePaymentPartiallyFailData: DeletePaymentOutput = {
//     data: {
//         id: PARTIALLY_FAIL_INTENT_ID
//     }
// };

// // REFUND PAYMENT DATA

// export const refundPaymentSuccessData: RefundPaymentOutput = {
//     data: {
//         sessionid: PaymentIntentDataByStatus.ATTEMPTED.id
//     }
// };

// export const refundPaymentFailData: RefundPaymentOutput = {
//     data: {
//         id: FAIL_INTENT_ID
//     },
// };

// // RETRIEVE PAYMENT DATA

// export const retrievePaymentSuccessData: RetrievePaymentOutput = {
//     data: {
//         id: PaymentIntentDataByStatus.ATTEMPTED.id,
//     },
// };

// export const retrievePaymentFailData: RetrievePaymentOutput = {
//     data: {
//         id: FAIL_INTENT_ID
//     },
// };

// // UPDATE PAYMENT DATA

// export const updatePaymentContextWithExistingCustomer = {
//     email: EXISTING_CUSTOMER_EMAIL,
//     currency_code: "inr",
//     amount: 1000,
//     resource_id: "test",
//     customer: {},
//     context: {},
//     paymentSessionData: {
//         customer: "test",
//         amount: 1000
//     }
// };

// export const updatePaymentContextWithExistingCustomerRazorpayId = {
//     email: EXISTING_CUSTOMER_EMAIL,
//     currency_code: "inr",
//     amount: 1000,
//     resource_id: "test",
//     customer: {
//         metadata: {
//             razorpay_id: "test"
//         }
//     },
//     context: {},
//     paymentSessionData: {
//         customer: "test",
//         amount: 1000
//     }
// };

// export const updatePaymentContextWithWrongEmail = {
//     email: WRONG_CUSTOMER_EMAIL,
//     currency_code: "inr",
//     amount: 1000,
//     resource_id: "test",
//     customer: {},
//     context: {},
//     paymentSessionData: {
//         customer: "test",
//         amount: 1000
//     }
// };

// export const updatePaymentContextWithDifferentAmount = {
//     email: WRONG_CUSTOMER_EMAIL,
//     currency_code: "inr",
//     amount: 2000,
//     resource_id: "test",
//     customer: {
//         metadata: {
//             razorpay_id: "test"
//         }
//     },
//     context: {},
//     paymentSessionData: {
//         id: PaymentIntentDataByStatus.ATTEMPTED.id,
//         customer: "test",
//         amount: 1000
//     }
// };

// export const updatePaymentContextFailWithDifferentAmount = {
//     email: WRONG_CUSTOMER_EMAIL,
//     currency_code: "inr",
//     amount: 2000,
//     resource_id: "test",
//     customer: {
//         metadata: {
//             razorpay_id: "test"
//         }
//     },
//     context: {
//         metadata: {
//             razorpay_id: "test"
//         }
//     },
//     paymentSessionData: {
//         id: FAIL_INTENT_ID,
//         customer: "test",
//         amount: 1000
//     }
// };

// export const updatePaymentDataWithAmountData = {
//     sessionId: RAZORPAY_ID ?? "test",
//     amount: 2000
// };

// export const updatePaymentDataWithoutAmountData = {
//     sessionId: RAZORPAY_ID ?? "test",
//     id: RAZORPAY_ID ?? "test", // /duplication needs to be fixed
//     /** only notes can be updated */
//     notes: {
//         customProp: "test",
//         test: "test-string"
//     }
// };

// export const updatePaymentDataWithoutAmountDataNoNotes = {
//     sessionId: RAZORPAY_ID ?? "test",
//     id: RAZORPAY_ID ?? "test" // /duplication needs to be fixed
//     /** only notes can be updated */
// };
