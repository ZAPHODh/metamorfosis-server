
import z from 'zod'

type ValidateBodyParam<T> = {
    body: T,
    zodSchema: z.ZodSchema<T>
}

async function isValidBody<T>({ body, zodSchema }: ValidateBodyParam<T>) {
    const parsed = await zodSchema.safeParseAsync(body)
    if (parsed.error) {
        return parsed.error
    }
    return parsed.success

}

export { isValidBody }