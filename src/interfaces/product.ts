// Enums
export enum ProductStatus {
    IN_STOCK = "IN_STOCK",
    LOW_STOCK = "LOW_STOCK",
    OUT_OF_STOCK = "OUT_OF_STOCK",
}

export enum MaterialType {
    GOLD = "GOLD",
    SILVER = "SILVER",
    PLATINUM = "PLATINUM",
    STAINLESS_STEEL = "STAINLESS_STEEL",
    TITANIUM = "TITANIUM",
    LEATHER = "LEATHER",
    OTHER = "OTHER",
}

export enum GemstoneType {
    DIAMOND = "DIAMOND",
    RUBY = "RUBY",
    SAPPHIRE = "SAPPHIRE",
    EMERALD = "EMERALD",
    PEARL = "PEARL",
    AMETHYST = "AMETHYST",
    TOPAZ = "TOPAZ",
    OPAL = "OPAL",
    NONE = "NONE",
}

// Interfaces
export interface GalleryImage {
    src: string
    alt: Record<string, string>
    width: number
    height: number
}

export interface Price {
    value: number
    currency: string
    originalValue?: number
    discountPercentage?: number
}

export interface ProductMetadata {
    title: Record<string, string>
    description: Record<string, string>
    keywords: Record<string, string[]>
    openGraph: {
        title: Record<string, string>
        description: Record<string, string>
        image?: string
    }
}

export interface Material {
    type: MaterialType
    color?: string
    purity?: string // Ex: "18k", "925", etc.
    description?: Record<string, string>
}

export interface Gemstone {
    type: GemstoneType
    carat?: number
    color?: string
    clarity?: string
    cut?: string
    quantity?: number
    description?: Record<string, string>
}

export interface ProductDimension {
    length?: number
    width?: number
    height?: number
    diameter?: number
    unit: "mm" | "cm" | "in"
}

export interface ProductReview {
    id: string
    userId: string
    userName: string
    rating: number // 1-5
    title?: string
    content: string
    images?: string[]
    createdAt: Date
    updatedAt: Date
    verified: boolean
    likes: number
    dislikes: number
}

export interface PromoCode {
    id: string
    code: string
    discountType: "PERCENTAGE" | "FIXED"
    discountValue: number
    validFrom: Date
    validUntil: Date
    usageLimit?: number
    usageCount: number
    minimumPurchase?: number
    applicableProducts?: string[] // Product IDs
    applicableCollections?: string[] // Collection IDs
}

export interface ProductVariant {
    id: string
    sku: string
    attributes: Record<string, string> // Ex: { "size": "7", "color": "gold" }
    price: Price
    stock: number
    images?: GalleryImage[]
}

export interface Product {
    // Basic Information
    id: string
    slug: string
    sku: string
    name: Record<string, string> // Multilingual support
    description: Record<string, string> // Multilingual support
    shortDescription: Record<string, string> // Multilingual support

    // Pricing
    price: Record<string, Price> // Different currencies
    costPrice?: number

    // Categorization
    category: string
    subcategory?: string
    collections: string[] // Collection IDs
    tags: string[]

    // Media
    images: GalleryImage[]
    videos?: string[]
    threeDModel?: string // URL to 3D model

    // Physical Attributes
    materials: Material[]
    gemstones: Gemstone[]
    weight: number // in grams
    dimensions?: ProductDimension
    sizes?: string[] // Available sizes

    // Inventory
    stock: number
    status: ProductStatus
    lowStockThreshold?: number

    // Variants
    hasVariants: boolean
    variants?: ProductVariant[]

    // Marketing
    featured: boolean
    isNew: boolean
    promoCodes?: PromoCode[]

    // Performance
    rating: number // Average rating (1-5)
    reviewCount: number
    reviews?: ProductReview[]
    soldCount: number
    viewCount: number

    // SEO & Metadata
    metadata: ProductMetadata

    // Timestamps
    createdAt: Date
    updatedAt: Date
    publishedAt?: Date

    // Additional Info
    customizationOptions?: {
        allowEngraving: boolean
        allowSizeCustomization: boolean
        allowMaterialCustomization: boolean
        customizationNotes?: Record<string, string>
    }
    careInstructions?: Record<string, string>
    warranty?: {
        hasCertificate: boolean
        durationMonths?: number
        description?: Record<string, string>
    }

    // Internal use
    notes?: string
    hidden: boolean
}

// DTOs
export interface CreateProductDTO {
    costPrice: unknown
    slug: string
    sku: string
    name: Record<string, string>
    description: Record<string, string>
    shortDescription: Record<string, string>
    price: Record<string, Price>
    category: string
    subcategory?: string
    collections: string[]
    tags: string[]
    images: GalleryImage[]
    videos?: string[]
    threeDModel?: string
    materials: Material[]
    gemstones: Gemstone[]
    weight: number
    dimensions?: ProductDimension
    sizes?: string[]
    stock: number
    lowStockThreshold?: number
    hasVariants: boolean
    variants?: Omit<ProductVariant, "id">[]
    featured: boolean
    isNew: boolean
    metadata: ProductMetadata
    customizationOptions?: {
        allowEngraving: boolean
        allowSizeCustomization: boolean
        allowMaterialCustomization: boolean
        customizationNotes?: Record<string, string>
    }
    careInstructions?: Record<string, string>
    warranty?: {
        hasCertificate: boolean
        durationMonths?: number
        description?: Record<string, string>
    }
    notes?: string
    hidden: boolean
}

export interface UpdateProductDTO extends Partial<CreateProductDTO> {
    id: string
}

export interface ProductFilterParams {
    search?: string
    category?: string
    subcategory?: string
    collections?: string[]
    tags?: string[]
    materials?: MaterialType[]
    gemstones?: GemstoneType[]
    status?: ProductStatus
    featured?: boolean
    isNew?: boolean
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
    hasReviews?: boolean
    minRating?: number
    sortBy?: "name" | "price" | "rating" | "soldCount" | "createdAt" | "updatedAt"
    sortOrder?: "asc" | "desc"
    page?: number
    limit?: number
    language?: string
    currency?: string
}
