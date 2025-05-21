// Interfaces compartilhadas entre frontend e backend

import { PaymentStatus } from "@prisma/client"

// Enums
export enum ProductStatus {
    IN_STOCK = "IN_STOCK",
    LOW_STOCK = "LOW_STOCK",
    OUT_OF_STOCK = "OUT_OF_STOCK",
}

export enum OrderStatus {
    PENDING = "PENDING",
    PROCESSING = "PROCESSING",
    SHIPPED = "SHIPPED",
    DELIVERED = "DELIVERED",
    CANCELED = "CANCELED",
}

export enum PaymentMethod {
    CREDIT_CARD = "CREDIT_CARD",
    DEBIT_CARD = "DEBIT_CARD",
    PIX = "PIX",
    BANK_TRANSFER = "BANK_TRANSFER",
    BOLETO = "BOLETO",
    CASH = "CASH",
}

export enum EmployeeRole {
    ADMIN = "ADMIN",
    MANAGER = "MANAGER",
    SALESPERSON = "SALESPERSON",
    INVENTORY = "INVENTORY",
    SUPPORT = "SUPPORT",
}

export enum EmployeeStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
}

export enum SupportTicketStatus {
    OPEN = "OPEN",
    ANSWERED = "ANSWERED",
    CLOSED = "CLOSED",
}

export enum SupportTicketPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
}

export enum SupportTicketCategory {
    ORDER = "ORDER",
    PRODUCT = "PRODUCT",
    PAYMENT = "PAYMENT",
    SHIPPING = "SHIPPING",
    RETURN = "RETURN",
    OTHER = "OTHER",
}

export enum SupportMessageSender {
    CUSTOMER = "CUSTOMER",
    STAFF = "STAFF",
}

// Interfaces base
export interface BaseEntity {
    id: string
    createdAt: Date
    updatedAt: Date
}

// Produto
export interface Product extends BaseEntity {
    name: string
    sku: string
    description: string
    price: number
    costPrice?: number
    discountPercentage?: number
    category: string
    subcategory?: string
    materials: string[]
    weight?: number // em gramas
    dimensions?: {
        length?: number
        width?: number
        height?: number
    }
    images: string[]
    stock: number
    status: ProductStatus
    featured: boolean
    collections: string[] // IDs das coleções
    tags: string[]
    attributes: Record<string, string> // Atributos personalizados como cor, tamanho, etc.
    seo?: {
        title?: string
        description?: string
        keywords?: string[]
    }
}

// Coleção
export interface Collection extends BaseEntity {
    name: string
    description: string
    startDate?: Date
    endDate?: Date
    featured: boolean
    image?: string
    products: string[] // IDs dos produtos
    slug: string
    active: boolean
    order: number
}

// Cliente
export interface Customer extends BaseEntity {
    name: string
    email: string
    phone?: string
    document?: string // CPF/CNPJ
    birthDate?: Date
    addresses: Address[]
    orders: string[] // IDs dos pedidos
    notes?: string
    marketingConsent: boolean
    totalSpent: number
    lastPurchase?: Date
    passwordHash?: string // Apenas no backend
    avatar?: string
}

// Endereço
export interface Address extends BaseEntity {
    customerId: string
    type: "BILLING" | "SHIPPING" | "BOTH"
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
    country: string
    isDefault: boolean
}

// Pedido/Venda
export interface Order extends BaseEntity {
    orderNumber: string
    customerId: string
    customer?: Customer // Relacionamento
    items: OrderItem[]
    subtotal: number
    discountTotal: number
    shippingTotal: number
    taxTotal: number
    total: number
    status: OrderStatus
    paymentMethod: PaymentMethod
    paymentStatus: "PENDING" | "PAID" | "REFUNDED" | "FAILED"
    shippingAddress: Address
    billingAddress: Address
    notes?: string
    trackingNumber?: string
    shippingCarrier?: string
    estimatedDelivery?: Date
    completedAt?: Date
    canceledAt?: Date
    refundedAt?: Date
}

// Item do Pedido
export interface OrderItem extends BaseEntity {
    orderId: string
    productId: string
    product?: Product // Relacionamento
    quantity: number
    unitPrice: number
    discount: number
    total: number
    notes?: string
}

// Funcionário
export interface Employee extends BaseEntity {
    name: string
    email: string
    phone?: string
    document?: string // CPF
    role: EmployeeRole
    department: string
    status: EmployeeStatus
    startDate: Date
    endDate?: Date
    passwordHash?: string // Apenas no backend
    avatar?: string
    permissions: string[]
}

// Ticket de Suporte
export interface SupportTicket extends BaseEntity {
    ticketNumber: string
    subject: string
    customerId: string
    customer?: Customer // Relacionamento
    status: SupportTicketStatus
    priority: SupportTicketPriority
    category: SupportTicketCategory
    messages: SupportMessage[]
    assignedToId?: string
    assignedTo?: Employee // Relacionamento
    closedAt?: Date
    unread: boolean
}

// Mensagem de Suporte
export interface SupportMessage extends BaseEntity {
    ticketId: string
    content: string
    sender: SupportMessageSender
    attachments?: {
        name: string
        url: string
        type: string
    }[]
}

// Configurações da Loja
export interface StoreSettings extends BaseEntity {
    storeName: string
    storeDescription?: string
    logo?: string
    address?: Address
    phone?: string
    email?: string
    socialMedia?: {
        facebook?: string
        instagram?: string
        twitter?: string
        youtube?: string
        tiktok?: string
    }
    businessHours?: {
        monday?: string
        tuesday?: string
        wednesday?: string
        thursday?: string
        friday?: string
        saturday?: string
        sunday?: string
    }
    taxSettings?: {
        taxRate: number
        includeTaxInPrice: boolean
    }
    shippingSettings?: {
        freeShippingThreshold?: number
        defaultShippingCost: number
    }
    notificationSettings?: {
        salesNotifications: boolean
        stockNotifications: boolean
        customerNotifications: boolean
        marketingNotifications: boolean
    }
}

// Interfaces para requisições e respostas da API

// Produtos
export interface CreateProductDTO {
    name: string
    sku: string
    description: string
    price: number
    costPrice?: number
    discountPercentage?: number
    category: string
    subcategory?: string
    materials: string[]
    weight?: number
    dimensions?: {
        length?: number
        width?: number
        height?: number
    }
    images: string[]
    stock: number
    featured: boolean
    collections: string[]
    tags: string[]
    attributes: Record<string, string>
    seo?: {
        title?: string
        description?: string
        keywords?: string[]
    }
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
    id: string
}

export interface ProductFilterParams {
    search?: string
    category?: string
    subcategory?: string
    status?: ProductStatus
    collection?: string
    featured?: boolean
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    sortBy?: "name" | "price" | "stock" | "createdAt"
    sortOrder?: "asc" | "desc"
    page?: number
    limit?: number
}

// Coleções
export interface CreateCollectionDTO {
    name: string
    description: string
    startDate?: Date
    endDate?: Date
    featured: boolean
    image?: string
    products: string[]
    slug: string
    active: boolean
    order: number
}

export interface UpdateCollectionDTO extends Partial<CreateCollectionDTO> {
    id: string
}

export interface CollectionFilterParams {
    search?: string
    active?: boolean
    featured?: boolean
    hasProducts?: boolean
    sortBy?: "name" | "startDate" | "createdAt" | "order"
    sortOrder?: "asc" | "desc"
    page?: number
    limit?: number
}

// Clientes
export interface CreateCustomerDTO {
    name: string
    email: string
    phone?: string
    document?: string
    birthDate?: Date
    addresses: Omit<Address, "id" | "createdAt" | "updatedAt" | "customerId">[]
    notes?: string
    marketingConsent: boolean
    password?: string
    avatar?: string
}

export interface UpdateCustomerDTO extends Partial<Omit<CreateCustomerDTO, "password">> {
    id: string
    newPassword?: string
}

export interface CustomerFilterParams {
    search?: string
    hasOrders?: boolean
    minTotalSpent?: number
    maxTotalSpent?: number
    sortBy?: "name" | "totalSpent" | "lastPurchase" | "createdAt"
    sortOrder?: "asc" | "desc"
    page?: number
    limit?: number
}

export type OrderFilters = {
    search?: string
    status?: string
    startDate?: string
    endDate?: string
    sortBy: string
    sortOrder: "asc" | "desc"
    page: number
    limit: number
}

type OrderItemInput = {
    productId: string
    variantId?: string
    quantity: number
    unitPrice: number
    discount: number
    notes?: string
}

export type OrderInput = {
    userId: string
    subtotal: number
    discountTotal: number
    shippingTotal: number
    taxTotal: number
    total: number
    status?: OrderStatus
    paymentMethod: PaymentMethod
    paymentStatus?: PaymentStatus
    notes?: string
    billingAddressId: string
    shippingAddressId: string
    items: OrderItemInput[]
    createdById?: string
}

export type OrderStatusUpdate = {
    status: OrderStatus
    trackingNumber?: string
    shippingCarrier?: string
    estimatedDelivery?: Date
    notes?: string
}
export interface CreateOrderDTO {
    customerId: string
    items: {
        productId: string
        quantity: number
        unitPrice: number
        discount: number
    }[]
    shippingAddress: Omit<Address, "id" | "createdAt" | "updatedAt" | "customerId" | "type">
    billingAddress: Omit<Address, "id" | "createdAt" | "updatedAt" | "customerId" | "type">
    paymentMethod: PaymentMethod
    notes?: string
    shippingTotal: number
    discountTotal: number
}

export interface UpdateOrderDTO {
    id: string
    status?: OrderStatus
    paymentStatus?: "PENDING" | "PAID" | "REFUNDED" | "FAILED"
    trackingNumber?: string
    shippingCarrier?: string
    estimatedDelivery?: Date
    notes?: string
}

export interface OrderFilterParams {
    search?: string
    customerId?: string
    status?: OrderStatus
    paymentMethod?: PaymentMethod
    paymentStatus?: "PENDING" | "PAID" | "REFUNDED" | "FAILED"
    minTotal?: number
    maxTotal?: number
    startDate?: Date
    endDate?: Date
    sortBy?: "orderNumber" | "total" | "createdAt" | "status"
    sortOrder?: "asc" | "desc"
    page?: number
    limit?: number
}


export interface CreateEmployeeDTO {
    name: string
    email: string
    phone?: string
    document?: string
    role: EmployeeRole
    department: string
    startDate: Date
    password: string
    avatar?: string
    permissions: string[]
}

export interface UpdateEmployeeDTO extends Partial<Omit<CreateEmployeeDTO, "password">> {
    id: string
    newPassword?: string
    status?: EmployeeStatus
    endDate?: Date
}

export interface EmployeeFilterParams {
    search?: string
    role?: EmployeeRole
    department?: string
    status?: EmployeeStatus
    sortBy?: "name" | "role" | "department" | "startDate"
    sortOrder?: "asc" | "desc"
    page?: number
    limit?: number
}


export interface CreateSupportTicketDTO {
    subject: string
    customerId: string
    category: SupportTicketCategory
    priority: SupportTicketPriority
    initialMessage: {
        content: string
        attachments?: {
            name: string
            url: string
            type: string
        }[]
    }
}

export interface UpdateSupportTicketDTO {
    id: string
    status?: SupportTicketStatus
    priority?: SupportTicketPriority
    assignedToId?: string
    unread?: boolean
}

export interface AddSupportMessageDTO {
    ticketId: string
    content: string
    sender: SupportMessageSender
    attachments?: {
        name: string
        url: string
        type: string
    }[]
}

export interface SupportTicketFilterParams {
    search?: string
    customerId?: string
    status?: SupportTicketStatus
    priority?: SupportTicketPriority
    category?: SupportTicketCategory
    assignedToId?: string
    unread?: boolean
    sortBy?: "createdAt" | "priority" | "status"
    sortOrder?: "asc" | "desc"
    page?: number
    limit?: number
}

// Autenticação
export interface LoginDTO {
    email: string
    password: string
}

export interface LoginResponseDTO {
    token: string
    user: {
        id: string
        name: string
        email: string
        role: EmployeeRole
        avatar?: string
    }
}

export interface ChangePasswordDTO {
    currentPassword: string
    newPassword: string
}

// Estatísticas e Relatórios
export interface DashboardStats {
    totalRevenue: number
    totalOrders: number
    totalCustomers: number
    averageOrderValue: number
    revenueByPeriod: {
        period: string
        revenue: number
    }[]
    topProducts: {
        id: string
        name: string
        sales: number
        revenue: number
    }[]
    topCollections: {
        id: string
        name: string
        sales: number
        revenue: number
    }[]
    lowStockProducts: {
        id: string
        name: string
        stock: number
    }[]
    recentOrders: {
        id: string
        orderNumber: string
        customer: {
            id: string
            name: string
        }
        total: number
        status: OrderStatus
        createdAt: Date
    }[]
}

export interface SalesReport {
    startDate: Date
    endDate: Date
    totalRevenue: number
    totalOrders: number
    averageOrderValue: number
    salesByDay: {
        date: string
        orders: number
        revenue: number
    }[]
    salesByCategory: {
        category: string
        orders: number
        revenue: number
        percentage: number
    }[]
    salesByPaymentMethod: {
        method: PaymentMethod
        orders: number
        revenue: number
        percentage: number
    }[]
    topProducts: {
        id: string
        name: string
        quantity: number
        revenue: number
    }[]
    topCustomers: {
        id: string
        name: string
        orders: number
        revenue: number
    }[]
}

export interface InventoryReport {
    totalProducts: number
    totalValue: number
    productsByCategory: {
        category: string
        count: number
        value: number
        percentage: number
    }[]
    lowStockProducts: {
        id: string
        name: string
        sku: string
        stock: number
        reorderPoint: number
    }[]
    outOfStockProducts: {
        id: string
        name: string
        sku: string
        lastInStock: Date
    }[]
    topSellingProducts: {
        id: string
        name: string
        sku: string
        sold: number
        revenue: number
    }[]
    inventoryTurnover: number
}
