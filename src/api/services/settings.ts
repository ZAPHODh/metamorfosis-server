import { StoreSettings } from "@prisma/client"
import { prisma } from "../../../prisma/prisma"
import { UpdateStoreSettingsDto } from "../../interfaces"

export async function getSettings(): Promise<StoreSettings | null> {
    try {
        const settings = await prisma.storeSettings.findFirst()
        return settings
    } catch (error) {
        console.error("Erro ao buscar configurações da loja:", error)
        throw error
    }
}
export async function updateSettings(data: UpdateStoreSettingsDto): Promise<StoreSettings | null> {
    try {
        const existingSettings = await prisma.storeSettings.findFirst()
        if (!existingSettings) {
            throw new Error("Configurações da loja não encontradas")
        }
        const newSettings = await prisma.storeSettings.update({
            where: { id: existingSettings.id },
            data
        })

        return newSettings
    } catch (error) {
        console.error("Erro ao atualizar configurações da loja:", error)
        throw error
    }
}


export const settingsService = {
    getSettings,
    updateSettings,
}

export default settingsService
