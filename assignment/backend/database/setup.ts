
//postgre module
import { Pool, PoolClient } from 'pg';
//file system
import * as fs from 'fs';
//my db connection handler
import { db_client_connect, db_connect } from './connection'
//db info
import { info } from './config'

/*
NOTE
I am not using preprepared statments here as these shall all be direct without external user input
*/

//sets up the database
//this will create/overwrite a new database
//then will run the sql construction script, and the insertion script
async function setup(): Promise<void>
{
    //get the client connection
    let client: PoolClient;
    try
    {
        client = await db_client_connect();
    } catch (error)
    {
        //if it fails to connect, exit
        console.log("Failed to connect to client: " + error);
        return;
    }

    //create the empty database
    if (!await create_database(client)) return;

    //once database is created, connect to it
    try
    {
        //close old connection
        client.release();

        //get db connection
        client = await db_connect();
    } catch (error)
    {
        //if it fails to connect, exit
        console.log("Failed to connect to database: " + error);
        return;
    }

    //all this will be done inside a transaction so it all runs at once
    await client.query("BEGIN");

    //construct tables
    if (!await construct_database(client)) return;
    //populate tables
    if (!await populate_database(client)) return;

    //end the transaction
    await client.query('COMMIT');

    //release the client once complete
    if (client) client.release();

    return;
}

//creates a new database, or deletes it and recreates it if it already exists
async function create_database(client: PoolClient): Promise<boolean>
{
    //ensure it can connect
    try
    {
        await client.query(`DROP DATABASE IF EXISTS ${info.database_name};`);
        await client.query(`CREATE DATABASE ${info.database_name};`);
    }
    catch (error)
    {
        console.log("Failed to connect to database: " + error);
        return false;
    }
    return true;
}

//creates the structure of the database from the sql script
async function construct_database(client: PoolClient): Promise<boolean>
{
    if (!fs.existsSync(info.construction_script))
    {
        console.log("No construction script found. Exiting.");
        return false;
    }

    //get construction script and append USE DATABASE to it
    const construct_script = fs.readFileSync(info.construction_script, "utf-8");

    //log
    console.log("Constructing database using the following script:\n" + construct_script);

    //try construct
    try
    {
        client.query(construct_script);
    }
    catch (error)
    {
        console.log("Error constructing database: " + error);
        return false;
    }

    return true;
}

//populates tables with data
async function populate_database(client: PoolClient): Promise<boolean>
{
    if (!fs.existsSync(info.insertion_script))
    {
        console.log("No insertion script found. Exiting.");
        return false;
    }

    //get construction script and append USE DATABASE to it
    const insert_script = fs.readFileSync(info.insertion_script, "utf-8");

    //log
    console.log("Populating database using the following script:\n" + insert_script);

    //try populate
    try
    {
        client.query(insert_script);
    }
    catch (error)
    {
        console.log("Error populating database: " + error);
        return false;
    }

    return true;
}

setup();