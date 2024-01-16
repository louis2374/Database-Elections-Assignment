async function test()
{
    get_request("test", { "name": "james", "age": "23" });
}

function update_display_for_results(results: string)
{
    let display = document.getElementById("test-display");

    if (display) display.innerHTML = JSON.stringify(results);
}

async function event_select_change(event: Event)
{
    update_display_for_results("");

    let system_id = event.target as HTMLSelectElement;

    if (system_id)
    {
        let response: string = await get_request("results", { "system": system_id.value });
        update_display_for_results(response.replace(/\\/g, ""));
    }
}

async function create_result_table()
{
    let table = `<table><thead>
    <th>Result ID</th>
    <th>System ID</th>
    <th>Seats</th>
    <th>Seat vs Pop</th>
    <th>Seat %</th>
    <th>Vote %</th>
    <th>Winner Matches</th>
    <th>Winning Party</th>
    <th>Most Seats Party</th>
    </thread>
    <tbody>`;


    let systems = ["fptp", "spr", "sprt5"];

    //create a row for each query
    await Promise.all(systems.map(async (system) =>
    {
        let response: string = await get_request("results", { "system": system });
        table += create_table_row(response);
        return
    }));

    console.log("table");
    table += "</tbody></table>";

    document.getElementsByClassName("main")[0].innerHTML = table;
}

function create_table_row(results: string): string
{
    let parsed = JSON.parse(results)["data"]["result"];
    let row = "<tr>";



    let keys = Object.keys(parsed)

    keys.forEach((key: string) =>
    {
        row += `<td>${parsed[key]}</td>`;
    })

    return row + "</tr>"
}