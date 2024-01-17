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
    const total_votes: number = await get_total_votes(connection);

    //total number of seats available is total number of constituencys
    const total_seats: number = await get_total_number_of_seats(connection);

    //get a list of all counties
    const all_parties = await get_all_party_votes(connection);

    //ensure all were retrieved properly
    if (total_votes === 0 || all_parties.length === 0 || total_seats === 0)
    {
        console.log("Unable to retrieve vote data.");
        return {};
    }

    //to store parties and their allocated seats, and last quot
    let allocated_seats: Array<{ party: number, seats: number, quot: number, votes: number }> = new Array();

    //fill allocated seats
    all_parties.map(party =>
    {
        allocated_seats.push({ party: party.party_id, seats: 0, quot: 0, votes: party.votes });
    })

    //how many seats left to allocate
    let remaining_seats = total_seats;

    //repeat rounds until there are no more seats left
    for (remaining_seats; remaining_seats > 0; remaining_seats--)
    {
        //calculate the quote of each party
        allocated_seats = allocated_seats.map((party) =>
        {
            party.quot = party.votes / (party.seats + 1);
            return party;
        })

        //sort to find highest quote
        allocated_seats.sort((a, b) =>
        {
            return b.quot - a.quot
        });

        //give the highest quote a seat
        allocated_seats[0].seats++;
    }

    //sort by num of seats
    allocated_seats.sort((a, b) =>
    {
        return b.seats - a.seats
    });

    //winner data
    let percent_of_seats = allocated_seats[0].seats / total_seats;
    let percent_of_votes = allocated_seats[0].votes / total_votes;

    //add to database, and return itself
    return insert_result_calculation(
        System.DH_COUNTRY,
        allocated_seats[0].seats,
        percent_of_seats - percent_of_votes,
        percent_of_seats,
        percent_of_votes,
        allocated_seats[0].party,
        allocated_seats[0].party
    );
};