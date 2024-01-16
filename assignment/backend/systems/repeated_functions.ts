import { Pool, PoolClient, QueryResult } from "pg";


//returns total number of votes
export async function get_total_votes(_connection: PoolClient): Promise<number>
{
    //just a very simple query to get sum
    let query_response: QueryResult = await _connection.query("SELECT SUM(vote_votes) FROM tbl_votes;");

    //return... im not doing a check it exists because for now it shouldnt
    return Number(query_response.rows[0].sum);
}

export async function get_votes_for_party(_connection: PoolClient, _party: number): Promise<number>
{
    let query_response: QueryResult = await _connection.query(`
SELECT
    --i only need total votes
    SUM(tbl_votes.vote_votes)
FROM
    tbl_candidates
JOIN
    tbl_votes ON tbl_votes.candidate_id = tbl_candidates.candidate_id
    --at this point i have a table linking candidates to their vote count
WHERE tbl_candidates.party_id = ${_party}
--now i group this by the party id, and it will sum the votes
GROUP BY
    tbl_candidates.party_id
`);

    //invalid response
    if (query_response.rowCount === 0) return 0;

    //counted
    return query_response.rows[0].sum;
}

export async function get_all_party_votes(_connection: PoolClient): Promise<Array<{ party_id: number, votes: number }>>
{
    //get all party votes
    let query_response: QueryResult = await _connection.query(`
SELECT
    --i only need party and total votes
    tbl_candidates.party_id,
    SUM(tbl_votes.vote_votes) as votes
FROM
    tbl_candidates
JOIN
    tbl_votes ON tbl_votes.candidate_id = tbl_candidates.candidate_id
    --at this point i have a table linking candidates to their vote count
	--now i group this by the party id, and it will sum the votes
GROUP BY
    tbl_candidates.party_id
    --ordered by number of votes, so winner is at the top
ORDER BY
	votes DESC;
    `);

    //if it got nothing
    if (query_response.rowCount === 0) return [];

    //return all the rows
    return query_response.rows;
}

export async function get_total_number_of_seats(_connection: PoolClient): Promise<number>
{
    //count constituencies
    let query_response: QueryResult = await _connection.query("SELECT COUNT(*) FROM tbl_constituencies;");

    //return directly
    return Number(query_response.rows[0].count);
}