import { PoolClient, QueryResult } from "pg";


//returns total number of votes
export async function get_total_votes(_connection: PoolClient): Promise<number>
{
    //just a very simple query to get sum
    let query_response: QueryResult = await _connection.query("SELECT SUM(vote_votes) FROM tbl_votes;");
    console.log(query_response.rows);
    //return... im not doing a check it exists because for now it shouldnt
    return Number(query_response.rows[0].sum);
}