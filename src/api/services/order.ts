
import { v4 as uuidv4 } from "uuid"
import { prisma } from "../../../prisma/prisma"
import { OrderFilters, OrderInput, OrderStatusUpdate } from "../../interfaces"

const orderService = {
    getOrders: async (filters: OrderFilters) => {
        const { search, status, startDate, endDate, sortBy, sortOrder, page, limit } = filters
        const skip = (page - 1) * limit
        const where: any = {}

        if (search) {
            where.OR = [
                { orderNumber: { contains: search, mode: "insensitive" } },
                {
                    user: {
                        OR: [
                            { name: { contains: search, mode: "insensitive" } },
                            { email: { contains: search, mode: "insensitive" } },
                        ],
                    },
                },
            ]
        }
        if (status) {
            where.status = status
        }
        if (startDate && endDate) {
            where.createdAt = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            }
        } else if (startDate) {
            where.createdAt = {
                gte: new Date(startDate),
            }
        } else if (endDate) {
            where.createdAt = {
                lte: new Date(endDate),
            }
        }
        const totalCount = await prisma.order.count({ where })
        const orders = await prisma.order.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                images: true,
                            },
                        },
                    },
                },
                billingAddress: true,
                shippingAddress: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: {
                [sortBy]: sortOrder,
            },
            skip,
            take: limit,
        })

        return {
            data: orders,
            pagination: {
                total: totalCount,
                page,
                limit,
                pages: Math.ceil(totalCount / limit),
            },
        }
    },

    getOrderById: async (id: string) => {
        return prisma.order.findUnique({
            where: { id },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        document: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                images: true,
                            },
                        },
                    },
                },
                billingAddress: true,
                shippingAddress: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })
    },

    createOrder: async (data: OrderInput) => {
        const orderNumber = `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`
        return prisma.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    orderNumber,
                    userId: data.userId,
                    subtotal: data.subtotal,
                    discountTotal: data.discountTotal,
                    shippingTotal: data.shippingTotal,
                    taxTotal: data.taxTotal,
                    total: data.total,
                    status: data.status || "PENDING",
                    paymentMethod: data.paymentMethod,
                    paymentStatus: data.paymentStatus || "PENDING",
                    notes: data.notes,
                    billingAddressId: data.billingAddressId,
                    shippingAddressId: data.shippingAddressId,
                    createdById: data.createdById,
                },
            })
            for (const item of data.items) {
                await tx.orderItem.create({
                    data: {
                        orderId: order.id,
                        productId: item.productId,
                        variantId: item.variantId,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        discount: item.discount,
                        total: (item.unitPrice - item.discount) * item.quantity,
                        notes: item.notes,
                    },
                })
                await tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                        soldCount: {
                            increment: item.quantity,
                        },
                    },
                })
            }
            await tx.user.update({
                where: { id: data.userId },
                data: {
                    totalSpent: {
                        increment: data.total,
                    },
                    lastPurchase: new Date(),
                },
            })
            return tx.order.findUnique({
                where: { id: order.id },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true,
                                    images: true,
                                },
                            },
                        },
                    },
                    billingAddress: true,
                    shippingAddress: true,
                },
            })
        })
    },

    updateOrder: async (id: string, data: Partial<OrderInput>) => {
        const existingOrder = await prisma.order.findUnique({
            where: { id },
            include: { items: true },
        })

        if (!existingOrder) {
            return null
        }
        return prisma.$transaction(async (tx) => {
            const updatedOrder = await tx.order.update({
                where: { id },
                data: {
                    subtotal: data.subtotal,
                    discountTotal: data.discountTotal,
                    shippingTotal: data.shippingTotal,
                    taxTotal: data.taxTotal,
                    total: data.total,
                    status: data.status,
                    paymentMethod: data.paymentMethod,
                    paymentStatus: data.paymentStatus,
                    notes: data.notes,
                    billingAddressId: data.billingAddressId,
                    shippingAddressId: data.shippingAddressId,
                },
            })
            if (data.items && data.items.length > 0) {
                await tx.orderItem.deleteMany({
                    where: { orderId: id },
                })
                for (const item of existingOrder.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                increment: item.quantity,
                            },
                            soldCount: {
                                decrement: item.quantity,
                            },
                        },
                    })
                }
                for (const item of data.items) {
                    await tx.orderItem.create({
                        data: {
                            orderId: id,
                            productId: item.productId,
                            variantId: item.variantId,
                            quantity: item.quantity,
                            unitPrice: item.unitPrice,
                            discount: item.discount,
                            total: (item.unitPrice - item.discount) * item.quantity,
                            notes: item.notes,
                        },
                    })
                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stock: {
                                decrement: item.quantity,
                            },
                            soldCount: {
                                increment: item.quantity,
                            },
                        },
                    })
                }
            }
            return tx.order.findUnique({
                where: { id },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                        },
                    },
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    sku: true,
                                    images: true,
                                },
                            },
                        },
                    },
                    billingAddress: true,
                    shippingAddress: true,
                },
            })
        })
    },

    updateOrderStatus: async (id: string, data: OrderStatusUpdate) => {
        const existingOrder = await prisma.order.findUnique({
            where: { id },
        })

        if (!existingOrder) {
            return null
        }
        const updateData: any = {
            status: data.status,
            notes: data.notes !== undefined ? data.notes : existingOrder.notes,
        }
        if (data.trackingNumber) {
            updateData.trackingNumber = data.trackingNumber
        }

        if (data.shippingCarrier) {
            updateData.shippingCarrier = data.shippingCarrier
        }

        if (data.estimatedDelivery) {
            updateData.estimatedDelivery = data.estimatedDelivery
        }

        if (data.status === "DELIVERED" && existingOrder.status !== "DELIVERED") {
            updateData.completedAt = new Date()
        } else if (data.status === "CANCELED" && (existingOrder.status as string) !== "CANCELED") {
            updateData.canceledAt = new Date()

            if ((existingOrder.status as string) !== "CANCELED") {
                const orderItems = await prisma.orderItem.findMany({
                    where: { orderId: id },
                })
                return prisma.$transaction(async (tx) => {
                    const updatedOrder = await tx.order.update({
                        where: { id },
                        data: updateData,
                    })

                    for (const item of orderItems) {
                        await tx.product.update({
                            where: { id: item.productId },
                            data: {
                                stock: {
                                    increment: item.quantity,
                                },
                                soldCount: {
                                    decrement: item.quantity,
                                },
                            },
                        })
                    }
                    return tx.order.findUnique({
                        where: { id },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                    phone: true,
                                },
                            },
                            items: {
                                include: {
                                    product: {
                                        select: {
                                            id: true,
                                            name: true,
                                            sku: true,
                                            images: true,
                                        },
                                    },
                                },
                            },
                            billingAddress: true,
                            shippingAddress: true,
                        },
                    })
                })
            }
        }
        return prisma.order.update({
            where: { id },
            data: updateData,
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                sku: true,
                                images: true,
                            },
                        },
                    },
                },
                billingAddress: true,
                shippingAddress: true,
            },
        })
    },
}

export default orderService




