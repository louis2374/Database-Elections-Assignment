import { PoolClient } from "pg";
import { db_connect } from "../database/connection";
import { System, insert_result_calculation } from "./system_handler";
import { get_all_counties, get_all_regions, get_party_votes_by_county, get_party_votes_by_region, get_total_number_of_seats, get_total_votes } from "./repeated_functions";

//export the main calc func
module.exports = calculate;

async function calculate(): Promise<object>
{
    let connection: PoolClient = await db_connect();

    //first, get total number of votes
    const total_votes: number = await get_total_votes(connection);

    //total number of seats available is total number of constituencys
    const total_seats: number = await get_total_number_of_seats(connection);

    //get a list of all regions
    const all_regions = await get_all_regions(connection);

    //ensure all were retrieved properly
    if (total_votes === 0 || all_regions.length === 0 || total_seats === 0)
    {
        console.log("Unable to retrieve vote data.");
        return {};
    }

    //calculate hare quota
    const hare_quota: number = total_votes / total_seats;

    //to store parties and their allocated seats
    let allocated_seats: Array<{ party: number, seats: number, remainder: number, votes: number; }> = new Array();

    //so i can calc remaining number of seats
    let remaining_seats = total_seats;

    //loop through each region, and allocate the first round of seats, saving the remainder
    await Promise.all(all_regions.map(async region =>
    {
        //get votes for parties within this region
        const parties = await get_party_votes_by_region(connection, region);

        parties.map(party =>
        {
            //calculate remainder and whole seats
            const votes = party.votes;
            const party_id = party.party_id;

            //no fractions so i floor it
            let seats = Math.floor(votes / hare_quota);

            let votes_remaining = votes % hare_quota;

            //to count how many seats are left to allocate
            remaining_seats -= seats;

            //add to new array
            allocated_seats.push({ party: party_id, seats: seats, remainder: votes_remaining, votes });
        });
    }));


    //now this contains a large number of duplicate parties, so i must combine the data
    let combined_results: Map<number, { seats: number, votes: number, remainder: number; }> = new Map();

    allocated_seats.map(party =>
    {
        if (combined_results.has(party.party))
        {
            //update the object in the map
            let object = combined_results.get(party.party);
            if (object)
            {
                object.remainder += party.remainder;
                object.seats += party.seats;
                object.votes += party.votes;
            }
        }
        else
        {
            //create new object in map
            combined_results.set(party.party, { seats: party.seats, votes: party.votes, remainder: party.remainder });
        }
    });

    //now just for my ease of use im going to put them back into the original allocated_seats array
    allocated_seats = new Array();
    combined_results.forEach((data, key) =>
    {
        //add each into the array
        allocated_seats.push({ party: key, seats: data.seats, remainder: data.remainder, votes: data.votes });
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
        System.LR_REGION,
        allocated_seats[0].seats,
        percent_of_seats - percent_of_votes,
        percent_of_seats,
        percent_of_votes,
        allocated_seats[0].party,
        allocated_seats[0].party
    );
};