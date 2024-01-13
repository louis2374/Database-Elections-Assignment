import express, { Request, Response } from 'express';
import { standard_response_error, standard_response_success } from './standard_response';
import { load_endpoints } from './routing';
const app = express();
const port = 3000; // or any other port you prefer

//will run for every request
app.use((req, res, next) =>
{
    //im just allowing cors from anywhere for ease of use. doesnt really matter right now as its only local
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");

    //preflight
    if (req.method === 'OPTIONS') res.status(200).send();

    next();
});


load_endpoints(app);



app.listen(port, () =>
{
    console.log(`Server is running at http://localhost:${port}`);
});
