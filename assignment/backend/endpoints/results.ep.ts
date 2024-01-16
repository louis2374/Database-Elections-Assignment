import { Response, Request } from 'express'
import { standard_response_error, standard_response_success } from '../standard_response';
import { db_connect } from '../database/connection';
import { PoolClient, QueryResult } from 'pg';
import { System, get_system } from '../systems/system_handler';

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


    //get the system results from the database
    let result: object = await get_system(_req.query.system as System);

    //if it existed, return it directly
    if (Object.keys(result).length !== 0)
    {
        standard_response_success(_res, { result });
        return;
    }
    else standard_response_error(_res, "err");

    connection.release();
};