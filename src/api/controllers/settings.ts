import { StoreSettings } from "@prisma/client"
import { asyncHandler } from "../../helper"
import settingsService from "../services/settings"

export const settingsController = {
    /**
     * Returns the current application settings.
     *
     * @returns {Promise<StoreSettings>} The stored settings.
     */
    getSettings: asyncHandler(async (_req, res) => {
        const settings = await settingsService.getSettings()
        res.json(settings)
    }),

    /**
     * Updates and returns the new application settings.
     *
     * @returns {Promise<StoreSettings>} The updated settings.
     */
    updateSettings: asyncHandler(async (req, res) => {
        const data = req.body
        const settings = await settingsService.updateSettings(data)
        res.json(settings)
    }),
}