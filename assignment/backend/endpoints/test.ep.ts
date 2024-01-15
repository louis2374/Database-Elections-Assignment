import { Response, Request } from 'express'
import { standard_response_error, standard_response_success } from '../standard_response';
import { get_system, System } from '../systems/system_handler';

module.exports = async function (_res: Response, _req: Request)
{
    //get the system results from the database
    let result: object = await get_system(System.FPTP);

    //if it existed, return it directly
    if (Object.keys(result).length !== 0)
    {
        standard_response_success(_res, { "result": result });
        return;
    }
    else standard_response_error(_res, "err");
};