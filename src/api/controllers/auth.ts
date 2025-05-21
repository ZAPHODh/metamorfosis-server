import { User } from '@prisma/client';
import bcrypt from 'bcryptjs';

import crypto from 'crypto';

import { v4 as uuidv4 } from 'uuid';
import { asyncHandler } from '../../helper';
import { prisma } from '../../../prisma/prisma';
import { signupSchema } from '../../../lib/zodschemas/user';




export const authController = {
    signup: asyncHandler(async (req, res) => {
        const user: Partial<User> = req.body;

        const parseduser = await signupSchema.safeParseAsync(user)

        if (parseduser.error) {
            res.status(400).json({ message: 'Campos obrigatórios não preenchidos' });
            return;
        }

        const { email, name, password } = parseduser.data
        const sanitizedEmail = email.toLowerCase();
        const sanitizedName = name.toLowerCase()
        const hashedPassword = await bcrypt.hash(password, 12);
        const accessToken = crypto
            .createHash('sha256')
            .update(uuidv4())
            .digest('hex');

        const createduser = await prisma.user.create({
            data: {
                name: sanitizedName,
                email: sanitizedEmail,
                password: hashedPassword,
                accessToken
            }
        });


        res.json({
            accessToken: accessToken,
            email: sanitizedEmail,
            user: {
                id: createduser.id,
                name: createduser.name,
                emailVerified: createduser.emailVerified,
                avatar: createduser.avatar
            },
        });
    }),
    signin: asyncHandler(
        async (req, res) => {
            const {
                email, password
            } = req.body;
            // 1. Add extra validation on the body payload and user existence
            const sanitizedEmail: string = email.toLowerCase();
            const user = await prisma.user.findFirst({
                where: { email: sanitizedEmail }
            });

            if (!user) {
                res.status(401).json({ message: 'Email inválido' });
                return;
            }

            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                res.status(401).json({ message: 'Invalid credentials' });
                return;
            }

            // 2. return the session object.
            // Could generate a new token upon login if needed
            // Could add extra information, e.g. roles, ...
            res.json({
                email: sanitizedEmail,
                accessToken: user.accessToken,
                user: {
                    id: user.id,
                    name: user.name,
                    emailVerified: user.emailVerified,
                    avatar: user.avatar
                },
            });
        }
    ),
    session: asyncHandler(async (req, res) => {
        const { authorization } = req.headers;
        if (!authorization) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const token = authorization.split(' ')[1];
        const user = await prisma.user.findFirst({
            where: {
                accessToken: token
            }
        });

        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const newAccessToken = crypto
            .createHash('sha256')
            .update(uuidv4())
            .digest('hex');

        await prisma.user.update({
            where: { id: user.id },
            data: { accessToken: newAccessToken }
        });
        res.json({
            accessToken: newAccessToken,
            email: user.email,
            user: {
                id: user.id,
                name: user.name,
                emailVerified: user.emailVerified,
                avatar: user.avatar
            }
        });
    }),
    secure: asyncHandler(async (req, res, next) => {
        const { authorization } = req.headers;
        if (!authorization) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }

        const token = authorization.split(' ')[1];
        const user = await prisma.user.findFirst({
            where: {
                accessToken: token
            }
        }
        );
        if (!user) {
            res.status(401).json({ message: 'Unauthorized' });
            return;
        }
        req.user = user
        next();
    })
};