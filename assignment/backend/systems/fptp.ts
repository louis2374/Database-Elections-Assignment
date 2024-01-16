import { PoolClient, QueryResult } from "pg";
import { db_connect } from "../database/connection";
import { System, insert_result_calculation } from "./system_handler";
import { get_total_votes, get_votes_for_party } from "./repeated_functions";

//export the main calc func
module.exports = calculate;

async function calculate(): Promise<object>
{
    let connection: PoolClient = await db_connect();

    //first list all constituencies
    let constituencies: Array<number> = await list_all_constituencies(connection);

    //stores all winners, total number of votes, and total number of wins
    let winners: Map<number, { votes: number, wins: number }> = new Map();

    //wait until this has completed
    await Promise.all(constituencies.map(async (constit) =>
    {
        //for each one, check who won
        let winner: { party: number, votes: number } = await find_constituency_winner(connection, constit);

        //add winner to the list
        if (winners.has(winner.party))
        {
            //get it from the map
            let winner_data = winners.get(winner.party);

            if (winner_data)
            {
                //update the data
                winner_data.votes += winner.votes;
                winner_data.wins += 1;

                //add back to set
                winners.set(winner.party, winner_data);
            }
        }
        //was not in the map, so create new obj with the data and add to map
        else
        {
            winners.set(winner.party, { votes: winner.votes, wins: 1 });
        }
    }));

    //no i must find the final winner
    let final_winner: { party: number, seats: number } = { party: 0, seats: 0 };

    //if it has more seats, it is the winner
    winners.forEach((winner, key) =>
    {
        //im not sure if there will be draws
        if (winner.wins === final_winner.seats) console.log("There was a draw calculating FPTP winners.");
        //if it is superior, update the winner to current value
        if (winner.wins > final_winner.seats)
        {
            final_winner.party = key;
            final_winner.seats = winner.wins;
        }
    });

    //calculate data that i need to store
    let total_winner_votes: number = await get_votes_for_party(connection, final_winner.party);

    //if it failed to get votes
    if (total_winner_votes === 0)
    {
        console.log("Failed to retrieve party votes.");
        return {};
    }

    //percent of votes
    let total_number_of_votes = await get_total_votes(connection);

    let percent_of_votes: number = total_winner_votes / total_number_of_votes;
    //1 set per constituency

    let percent_of_seats: number = final_winner.seats / constituencies.length;
    //close connection
    connection.release();

    //add to database, and return itself
    return insert_result_calculation(
        System.FPTP,
        final_winner.seats,
        percent_of_seats - percent_of_votes,
        percent_of_seats,
        percent_of_votes,
        false,//TODO (check that this is conservative?)
        final_winner.party,
        final_winner.party
    );
};

//this function will determine which party gets a seat for a specific constituency, as well as their total votes
async function find_constituency_winner(_db_connection: PoolClient, _constituency: number): Promise<{ party: number, votes: number }>
{
    //this will get each
    let all_votes_query: QueryResult = await _db_connection.query(`
        SELECT
            --i only need party and total votes
            tbl_candidates.party_id,
            SUM(tbl_votes.vote_votes) as votes
        FROM
            tbl_candidates
        JOIN
            tbl_votes ON tbl_votes.candidate_id = tbl_candidates.candidate_id
            --at this point i have a table linking candidates to their vote count
        WHERE
            tbl_candidates.constituency_id = ${_constituency}
        --now i group this by the party id, and it will sum the votes
        GROUP BY
            tbl_candidates.party_id
        --here i order it by total votes, reverse it so largest is at the top
        --then limit it to 1
        ORDER BY
            votes DESC
        LIMIT
            1
    `);

    //both 0 if it for some reason did not find anything
    if (all_votes_query.rowCount !== 1) return { party: 0, votes: 0 };

    return { party: all_votes_query.rows[0].party_id, votes: Number(all_votes_query.rows[0].votes) };
}

async function list_all_constituencies(_connection: PoolClient): Promise<Array<number>>
{
    let result: QueryResult = await _connection.query("SELECT constituency_id FROM tbl_constituencies");

    //empty array if it failed
    if (result.rowCount === 0) return [];

    console.log(1);
    //returns the result, as a 1d array
    return await Promise.all(result.rows.map(row => row.constituency_id));
}