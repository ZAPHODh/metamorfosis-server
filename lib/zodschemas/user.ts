import { z } from "zod"


export const signinSchema = z.object({
    email: z.string().email("Email inválido"),
    password: z.string().min(1, "Senha é obrigatória"),
})


export const signupSchema = z
    .object({
        name: z.string().min(1, "Nome é obrigatório"),
        email: z.string().email("Email inválido"),
        password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
        confirmPassword: z.string().min(6, "Confirmação de senha deve ter pelo menos 6 caracteres"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Senhas não conferem",
        path: ["confirmPassword"],
    })


export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Senha atual é obrigatória"),
        newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
        confirmNewPassword: z.string().min(6, "Confirmação de nova senha deve ter pelo menos 6 caracteres"),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Senhas não conferem",
        path: ["confirmNewPassword"],
    })

export const forgotPasswordSchema = z.object({
    email: z.string().email("Email inválido"),
})

export const resetPasswordSchema = z
    .object({
        token: z.string().min(1, "Token é obrigatório"),
        newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
        confirmNewPassword: z.string().min(6, "Confirmação de nova senha deve ter pelo menos 6 caracteres"),
    })
    .refine((data) => data.newPassword === data.confirmNewPassword, {
        message: "Senhas não conferem",
        path: ["confirmNewPassword"],
    })