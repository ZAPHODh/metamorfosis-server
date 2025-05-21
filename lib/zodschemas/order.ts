import { z } from "zod"
import { OrderStatus, PaymentMethod } from "../../src/interfaces"


const orderItemSchema = z.object({
    productId: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().positive(),
    discount: z.number().min(0),
})


const simpleAddressSchema = z.object({
    street: z.string().min(1, "Rua é obrigatória"),
    number: z.string().min(1, "Número é obrigatório"),
    complement: z.string().optional(),
    neighborhood: z.string().min(1, "Bairro é obrigatório"),
    city: z.string().min(1, "Cidade é obrigatória"),
    state: z.string().min(1, "Estado é obrigatório"),
    zipCode: z.string().min(1, "CEP é obrigatório"),
    country: z.string().min(1, "País é obrigatório"),
})


export const createOrderSchema = z.object({
    customerId: z.string(),
    items: z.array(orderItemSchema).min(1, "Pelo menos um item é obrigatório"),
    shippingAddress: simpleAddressSchema,
    billingAddress: simpleAddressSchema,
    paymentMethod: z.nativeEnum(PaymentMethod),
    notes: z.string().optional(),
    shippingTotal: z.number().min(0),
    discountTotal: z.number().min(0),
})


export const updateOrderSchema = z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "REFUNDED", "FAILED"]).optional(),
    trackingNumber: z.string().optional(),
    shippingCarrier: z.string().optional(),
    estimatedDelivery: z.string().datetime().optional(),
    notes: z.string().optional(),
})


export const orderFilterSchema = z.object({
    search: z.string().optional(),
    customerId: z.string().optional(),
    status: z.nativeEnum(OrderStatus).optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    paymentStatus: z.enum(["PENDING", "PAID", "REFUNDED", "FAILED"]).optional(),
    minTotal: z.number().optional(),
    maxTotal: z.number().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortBy: z.enum(["orderNumber", "total", "createdAt", "status"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    page: z.number().min(1).optional(),
    limit: z.number().min(1).max(100).optional(),
})
