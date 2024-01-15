import { Response, Request } from 'express'
import { standard_response_error, standard_response_success } from '../standard_response';
import { db_connect } from '../database/connection';
import { PoolClient, QueryResult } from 'pg';

module.exports = async function (_res: Response, _req: Request)
{
    //ensure system is set
    if (!_req.query.system)
    {
        standard_response_error(_res, "system must be defined.");
        return;
    }

    //ensure system is a valid system
    let connection: PoolClient = await db_connect();
    let query: QueryResult = await connection.query(`SELECT 1 FROM tbl_systems WHERE system_name = '${_req.query.system}'`);

    //must be 1 row for success
    if (query.rowCount !== 1)
    {
        standard_response_error(_res, "system is invalid.");
        return;
    }





    connection.release();
};