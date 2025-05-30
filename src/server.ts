import dotenv from 'dotenv';
import http from 'http';
import { app } from './app';
dotenv.config()

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;


server.once('error', (err) => {
    console.error(err);
    process.exit(1);
}).listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

export { server }