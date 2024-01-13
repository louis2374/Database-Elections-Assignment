import { Response } from 'express';

//this file ensures all responses are standardised

//basic response with data and status
function standard_response(_response: Response, _code: number, _data: object): void
{
    //get str status
    const status_string: string = (_code === 200 ? "success" : "error");

    //construct body by joining data into this
    const body: object = {
        status: status_string,
        data: { ..._data }
    };

    //send body and set status
    _response.status(_code).json(body);
}

//higher level functions for error/success
export function standard_response_success(_response: Response, _data: object): void
{
    //standard response
    standard_response(_response, 200, _data);
}

export function standard_response_error(_response: Response, _error_message: string, _code: number = 400): void
{
    //construct error obj
    const error: object = {
        code: _code,
        message: _error_message
    }

    //standard response
    standard_response(_response, _code, error);
}