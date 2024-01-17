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

    //list each party and its number of votes
    let party_votes = await get_all_party_votes(connection);

    //total number of seats available is total number of constituencys
    const total_seats: number = await get_total_number_of_seats(connection);

    //min vote %
    const threshold = 0.05;

    //ensure all were retrieved properly
    if (total_votes === 0 || party_votes.length === 0 || total_seats === 0)
    {
        console.log("Unable to retrieve vote data.");
        return {};
    }

    //first loop will remove all parties with under 5% of the total votes
    party_votes = party_votes.filter(party =>
    {
        return party.votes / total_votes >= threshold;
    });

    let recount_votes = 0;

    //then i recount the total votes
    party_votes.map(party =>
    {
        recount_votes += party.votes;
    });


    let remaining_seats = total_seats;
    let seat_vote_price = recount_votes / total_seats;

    //to store parties and their allocated seats
    let allocated_seats: Array<{ party: number, seats: number, remainder: number, votes: number; }> = new Array();

    //loop through each party, and allocate the first round of seats, saving the remainder
    party_votes.map(party =>
    {
        //calculate remainder and whole seats
        const votes = party.votes;
        const party_id = party.party_id;

        //no fractions so i floor it
        let seats = Math.floor(votes / seat_vote_price);
        let votes_remaining = votes % seat_vote_price;

        //to count how many seats are left to allocate
        remaining_seats -= seats;

        //add to new array
        allocated_seats.push({ party: party_id, seats: seats, remainder: votes_remaining, votes });
    });

    //now order by size of remainder, and give the remaning seats to the parties with the highest remainder
    allocated_seats.sort((a, b) =>
    {
        //sort in desc order
        return b.remainder - a.remainder;
    });

    //allocate remainders, will loop again if there are still seats
    let index = 0;
    while (remaining_seats > 0)
    {
        //give extra seat to that party
        allocated_seats[index++ % allocated_seats.length].seats += 1;
        remaining_seats -= 1;
    }

    //order the array by number of seats
    allocated_seats.sort((a, b) =>
    {
        //desc
        return b.seats - a.seats;
    });

    //winner data
    let percent_of_seats = allocated_seats[0].seats / total_seats;
    let percent_of_votes = allocated_seats[0].votes / total_votes;

    //add to database, and return itself
    return insert_result_calculation(
        System.SPRT5,
        allocated_seats[0].seats,
        percent_of_seats - percent_of_votes,
        percent_of_seats,
        percent_of_votes,
        allocated_seats[0].party,
        allocated_seats[0].party
    );
};