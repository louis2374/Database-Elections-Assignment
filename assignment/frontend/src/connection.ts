//handles api connections

//empty string if it failed
async function get_request(endpoint: string, params: Record<string, string>): Promise<string>
{
    let url: string = C_BASE_API;

    //map the params into a string
    //get keys
    let param_keys: Array<string> = Object.keys(params);
    //join the params, and encode for url
    let str_params: string = param_keys.map(key => encodeURIComponent(key) + "=" + encodeURIComponent(params[key])).join("&");

    //combine url endpoint and params
    url += endpoint + "?" + str_params;

    let response: Response = await fetch(url);

    return response.text();
}