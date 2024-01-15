//this file will handle systems, such as getting a system from database, and calculating it if it does not already exist

import { PoolClient, QueryResult } from "pg";
import { db_connect } from "../database/connection";
import fs from 'fs'
import path from 'path'

export enum System
{
    FPTP = 'fptp',
    GE_SPR = 'ge_spr',
    GE_SPRT5 = 'ge_sprt5',
    GE_PR_COUNTY = 'ge_pr_county',
    GE_PR_REGION = 'ge_pr_region',
    GE_PR_COUNTRY = 'ge_pr_country',
    GE_LR_COUNTY = 'ge_lr_county',
    GE_LR_REGION = 'ge_lr_region',
    GE_LR_COUNTRY = 'ge_lr_country',
    GE_DH_COUNTY = 'ge_dh_county',
    GE_DH_REGION = 'ge_dh_region',
    GE_DH_COUNTRY = 'ge_dh_country',
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
    _winner_matches_most_seats: boolean, //if the winning party is also that party that got the most seats
    _winning_party_id: number, //id of the party that won
    _party_with_most_seats: number //party that got the most seats
): Promise<object>
{
    //get a connection
    let connection: PoolClient = await db_connect();
    //query the insert, which also returns the new object
    let created_obj: QueryResult = await connection.query(`
    INSERT INTO tbl_results (
        system_id,
        result_seats,
        result_popular_votes_vs_seat_percent,
        result_percent_of_seats,
        result_percent_of_pop_votes,
        result_winner_matches_most_seats,
        winning_party_id,
        result_most_seats_party
    ) VALUES (
        (SELECT system_id FROM tbl_systems WHERE system_name = '${_system}'),
        ${_seats},
        ${_popular_votes_vs_seat_percent},
        ${_percent_of_seats},
        ${_percent_of_pop_votes},
        ${_winner_matches_most_seats === true ? 'TRUE' : 'FALSE'},
        ${_winning_party_id},
        ${_party_with_most_seats}
    ) ON CONFLICT DO NOTHING RETURNING *;
    `);

    //close connection
    connection.release();

    //return created obj
    return created_obj.rows[0];
}