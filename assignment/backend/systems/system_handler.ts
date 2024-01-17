//this file will handle systems, such as getting a system from database, and calculating it if it does not already exist

import { PoolClient, QueryResult } from "pg";
import { db_connect } from "../database/connection";
import fs from 'fs';
import path from 'path';

export enum System
{
    FPTP = 'fptp',
    SPR = 'spr',
    SPRT5 = 'sprt5',
    PR_COUNTY = 'pr_county',
    PR_REGION = 'pr_region',
    PR_COUNTRY = 'pr_country',
    LR_COUNTY = 'lr_county',
    LR_REGION = 'lr_region',
    LR_COUNTRY = 'lr_country',
    DH_COUNTY = 'dh_county',
    DH_REGION = 'dh_region',
    DH_COUNTRY = 'dh_country',
    CUSTOM = 'custom',
}

//this is the exported function, will handle calculation if it [system] does not exist
export async function get_system(_system: System): Promise<object>
{
    //get it from database
    let results: object = await query_system_results(_system);

    //it did not exist, so calculate it now
    if (Object.keys(results).length === 0)
    {
        console.log({ _system });
        //calculate the results, will return the object
        results = await calculate_system(_system);

        //if it failed stop here
        if (Object.keys(results).length === 0)
        {
            console.log("Failed to calculate system results.");
            return {};
        }

    }

    //return the row object
    return results;
}

//querys database for the system
async function query_system_results(_system: System): Promise<object>
{
    //first check if it has already been calculated in the database
    let connection: PoolClient = await db_connect();

    //query to check if this system exists in the results database
    //will not add duplicate systems
    let exists_query: QueryResult = await connection.query(`SELECT * FROM tbl_results WHERE system_id = (SELECT system_id from tbl_systems WHERE system_name = '${_system}');`);

    //if it does exist, just get it and return it
    if (exists_query.rowCount && exists_query.rowCount > 0)
    {
        //return the row object and close connection
        connection.release();
        return exists_query.rows[0];
    }

    //empty obj
    connection.release();
    return {};
}

//calculates the system, the system calculator will add it to database
async function calculate_system(_system: System): Promise<object>
{
    const folder_path = "./dist/backend/systems/";
    //calc file name for this sytem
    let full_path = folder_path + _system + ".js";

    //ensure file exists
    if (!fs.existsSync(path.resolve(full_path)))
    {
        console.log("Invalid system path: " + path.resolve(full_path));
        return {};
    }

    //load the file and call it
    const calculator = require(path.resolve(full_path));

    //calculate the result
    let created: object = await calculator();

    //if it did not fail
    if (created && Object.keys(created).length > 0)
    {
        //return obj
        return created;
    }

    //failed = empty obj
    return {};
}

//to insert a result to the table, will do nothing if this system already exists
export async function insert_result_calculation(
    _system: System, //system used to calculate
    _seats: number, //number of seats winning party gets
    _popular_votes_vs_seat_percent: number, //difference between % of votes and % of seats
    _percent_of_seats: number, //% of seats the winning party gets
    _percent_of_pop_votes: number, //% of votes the winning party got
    _party_width_most_seats: number, //party with the most seats
    _winning_party_id: number, //id of the party that won
    //_winner_matches_actual_winner: number = //party that won matches the actual 2019 uk election result (conservative)
): Promise<object>
{
    //get a connection
    let connection: PoolClient = await db_connect();

    let query = `
    INSERT INTO tbl_results (
        system_id,
        result_seats,
        result_popular_votes_vs_seat_percent,
        result_percent_of_seats,
        result_percent_of_pop_votes,
        result_party_with_most_seats,
        --only add winner if there is a winner
        ${_percent_of_seats > 0.5 ? "winning_party_id," : ""}
        result_winner_matches_real_winner
    ) VALUES (
        (SELECT system_id FROM tbl_systems WHERE system_name = '${_system}'),
        ${_seats},
        ${(_popular_votes_vs_seat_percent * 100).toFixed(2)},
        ${(_percent_of_seats * 100).toFixed(2)},
        ${(_percent_of_pop_votes * 100).toFixed(2)},
        ${_party_width_most_seats},
        ${_percent_of_seats > 0.5 ? _party_width_most_seats + " ," : ""}
        --kinda bad to do this but i know that conservative is always id 2
        ${(_winning_party_id === 2 && _percent_of_seats > 0.5) ? 'TRUE' : 'FALSE'}
    ) ON CONFLICT DO NOTHING RETURNING *;
    `;

    //query the insert, which also returns the new object
    let created_obj: QueryResult = await connection.query(query);

    //close connection
    connection.release();

    //return created obj
    return created_obj.rows[0];
}