//postgre module
import { Pool, PoolClient } from 'pg';
import { creds, info } from './config';

//try and connect to the database
//returns a promise containing the connection
export async function db_client_connect(): Promise<PoolClient>
{
    //create the connection pool
    const database_pool = new Pool({
        user: creds.database_user,
        host: creds.database_host,
        password: creds.database_password,
        port: creds.database_port,
    });

    return await database_pool.connect();
};

export async function db_connect(): Promise<PoolClient>
{
    //create the connection pool
    const database_pool = new Pool({
        user: creds.database_user,
        host: creds.database_host,
        password: creds.database_password,
        port: creds.database_port,
        database: info.database_name
    });

    return await database_pool.connect();
};
