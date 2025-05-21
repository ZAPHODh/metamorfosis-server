
export { };

declare global {
    namespace Express {
        interface Request {
            rawBody?: Buffer;
            user?: import('@prisma/client').User;
        }
    }
}