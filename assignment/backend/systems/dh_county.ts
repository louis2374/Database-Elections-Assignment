import { PoolClient } from "pg";
import { db_connect } from "../database/connection";
import { System, insert_result_calculation } from "./system_handler";
import { get_all_counties, get_party_votes_by_county, get_total_number_of_seats, get_total_votes } from "./repeated_functions";

//export the main calc func
module.exports = calculate;

async function calculate(): Promise<object>
{
    let connection: PoolClient = await db_connect();

    //first, get total number of votes
    const total_votes: number = await get_total_votes( connection );

    //total number of seats available is total number of constituencys
    const total_seats: number = await get_total_number_of_seats( connection );

    //get a list of all counties
    const all_counties = await get_all_counties( connection );

    //ensure all were retrieved properly
    if ( total_votes === 0 || all_counties.length === 0 || total_seats === 0 )
    {
        console.log( "Unable to retrieve vote data." );
        return {};
    }

    //calculate hare quota
    const hare_quota: number = total_votes / total_seats;

    //to store parties and their allocated seats
    let allocated_seats: Array<{ party: number, seats: number, remainder: number, votes: number; }> = new Array();

    //so i can calc remaining number of seats
    let remaining_seats = total_seats;

    //loop through each county, and allocate the first round of seats, saving the remainder
    await Promise.all( all_counties.map( async county =>
    {
        //get votes for parties within this county
        const parties = await get_party_votes_by_county( connection, county );

        //while  
        //while ()
        parties.map( party =>
        {
            //dhont alg here
            //for each party, determine its quote

            //add to new array
            // allocated_seats.push( { party: party_id, seats: seats, remainder: votes_remaining, votes } );
        } );
    } ) );








    //winner data
    let percent_of_seats = allocated_seats[ 0 ].seats / total_seats;
    let percent_of_votes = allocated_seats[ 0 ].votes / total_votes;


    //add to database, and return itself
    return insert_result_calculation(
        System.DH_COUNTY,
        allocated_seats[ 0 ].seats,
        percent_of_seats - percent_of_votes,
        percent_of_seats,
        percent_of_votes,
        allocated_seats[ 0 ].party,
        allocated_seats[ 0 ].party
    );
};