import {
    Request, Response, NextFunction
} from 'express';

export function asyncHandler(
    handler: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
    return async function (req: Request, res: Response, next: NextFunction) {
        try {
            return await handler(req, res, next);
        } catch (err) {
            next(err);
        }
    };
}