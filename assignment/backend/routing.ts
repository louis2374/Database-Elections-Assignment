import fs from 'fs'
import path from 'path'
import { Express, Request, Response } from 'express'
//this file will handle loading the endpoints

function list_endpoints_recursive(_dir: string, _hard_base: string = ""): Array<string>
{
    //automatic so i dont need to enter twice in ititial call
    if (_hard_base === "") _hard_base = _dir;

    //list files the current dir
    const files = fs.readdirSync(_dir);

    //total file list
    const dir_list: Array<string> = [];

    //for each file, i check if it is a folder, and then recursively call this function to retrieve the list
    files.forEach(file =>
    {
        //get relative path
        const full_path = path.join(_dir, file);
        const rel_path = path.relative(_hard_base, full_path);

        //dir or file
        if (fs.statSync(full_path).isDirectory())
        {
            //call itself and add results into main array
            dir_list.push(...list_endpoints_recursive(full_path, _hard_base));
        } else if (rel_path.endsWith(".ep.js"))
        {
            //files just get added directly
            dir_list.push(rel_path);
        }
    });

    return dir_list;
}

export function load_endpoints(_app: Express): Array<string>
{
    const ep_path = "./dist/backend/endpoints";
    let endpoints: Array<string>;

    //list files in endpoints file
    const files = list_endpoints_recursive(path.resolve(ep_path));

    //remove all extensions so its just the path
    endpoints = files.map(file => "/" + file.replace(".ep.js", "").replace(/\\/g, "/"));

    //now listen to each endpoint
    endpoints.forEach((endpoint, index) =>
    {
        console.log("Loading endpoint: " + endpoint);
        _app.get(endpoint, (req: Request, res: Response) =>
        {

            //load the endpoint file
            const ep = require(path.resolve(ep_path + "/" + files[index]));
            //call it
            ep(res, req);
        })
    });

    return files;
}