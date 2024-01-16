import { PoolClient } from "pg";
import { db_connect } from "../database/connection";
import { System, insert_result_calculation } from "./system_handler";
import { get_all_party_votes, get_total_number_of_seats, get_total_votes } from "./repeated_functions";

//export the main calc func
module.exports = calculate;

async function calculate(): Promise<object>
{
    let connection: PoolClient = await db_connect();

    //first, get total number of votes
    const total_votes: number = await get_total_votes( connection );

    //list each party and its number of votes
    const party_votes = await get_all_party_votes( connection );

    //total number of seats available is total number of constituencys
    const total_seats: number = await get_total_number_of_seats( connection );

    //ensure all were retrieved properly
    if ( total_votes === 0 || party_votes.length === 0 || total_seats === 0 )
    {
        console.log( "Unable to retrieve vote data." );
        return {};
    }

    let remaining_seats = total_seats;

    //to store parties and their allocated seats
    let allocated_seats: Array<{ party: number, seats: number, votes: number; }> = new Array();

    //fill allocated steats array
    party_votes.map( party =>
    {
        allocated_seats.push( { party: party.party_id, seats: 0, votes: party.votes } );
    } );

    //now loop through, and multiply each vote, by the remaning percent of votes
    allocated_seats.map( ( party, index ) =>
    {
        //dont modify last party
        if ( index === allocated_seats.length - 1 ) return;

        let compare = allocated_seats[ index + 1 ];
        //there is really no logic here. i was just messing around
        party.votes = party.votes * ( ( party.votes - compare.votes * 2 ) / party.votes );
    } );





    //now order by size of remainder, and give the remaning seats to the parties with the highest remainder
    allocated_seats.sort( ( a, b ) =>
    {
        //sort in desc order
        return b.votes - a.votes;
    } );

    //allocate remainders, will loop again if there are still seats
    let index = 0;
    while ( remaining_seats > 0 )
    {
        //give extra seat to that party
        allocated_seats[ index++ % allocated_seats.length ].seats += 1;
        remaining_seats -= 1;
    }

    //order the array by number of seats
    allocated_seats.sort( ( a, b ) =>
    {
        //desc
        return b.seats - a.seats;
    } );

    //winner data
    let percent_of_seats = allocated_seats[ 0 ].seats / total_seats;
    let percent_of_votes = allocated_seats[ 0 ].votes / total_votes;

    //add to database, and return itself
    return insert_result_calculation(
        System.CUSTOM,
        allocated_seats[ 0 ].seats,
        percent_of_seats - percent_of_votes,
        percent_of_seats,
        percent_of_votes,
        allocated_seats[ 0 ].party,
        allocated_seats[ 0 ].party
    );
};