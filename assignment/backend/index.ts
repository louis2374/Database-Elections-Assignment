// src/backend/server.ts
import express, { Request, Response } from 'express';

const app = express();
const port = 3000; // or any other port you prefer

app.get('/test', (req: Request, res: Response) =>
{
    const message = req.query.msg || 'Hello';
    res.send(`Received message: ${message}`);
});

app.listen(port, () =>
{
    console.log(`Server is running at http://localhost:${port}`);
});
