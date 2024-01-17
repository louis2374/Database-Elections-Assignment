import { Response, Request } from 'express'
import { standard_response_error, standard_response_success } from '../../standard_response';
import { db_connect } from '../../database/connection';
import { PoolClient, QueryResult } from 'pg';

module.exports = async function (_res: Response, _req: Request)
{
    //ensure system is set
    if (!_req.query.party)
    {
        standard_response_error(_res, "party must be defined.");
        return;
    }

    //get the party
    let connection: PoolClient = await db_connect();
    let query: QueryResult = await connection.query(`SELECT party_name FROM tbl_parties WHERE party_id = '${isNaN(Number(_req.query.party)) ? 0 : Number(_req.query.party)}'`);
    connection.release();

    //must be 1 row for success
    if (query.rowCount !== 1)
    {
        standard_response_error(_res, "party is invalid.");
        return;
    }

    //success, respond with name
    standard_response_success(_res, query.rows[0]);


};