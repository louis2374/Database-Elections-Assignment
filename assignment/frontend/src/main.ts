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
    <th>System</th>
    <th>Seats</th>
    <th>Seat %</th>
    <th>Vote %</th>
    <th>Seat vs Pop %</th>
    <th>Party with Most Seats</th>
    <th>Winning Party</th>
    <th>Winner Matches 2019</th>
    </thead>
    <tbody>`;


    let systems = ["fptp", "spr", "sprt5", "lr_county", "dh_country", "custom"];

    //create a row for each query
    const rows = await Promise.all(systems.map(async (system) =>
    {
        let response: string = await get_request("results", { "system": system });
        return await create_table_row(response);
    }));

    table += rows.join("") + "</tbody></table>";
    console.log("ROWS");
    document.getElementsByClassName("main")[0].innerHTML = table;
}

async function create_table_row(results: string): Promise<string>
{
    //parse result
    let parsed = JSON.parse(results)["data"]["result"];
    let row = "<tr>";

    //get system desc
    let desc = JSON.parse(await get_request("info/system", { "system": parsed.system_id })).data.system_desc;
    row += `<td>${desc}</td>`;

    //add static values
    row += `<td>${parsed.result_seats}</td>`;
    row += `<td>${parsed.result_percent_of_seats}%</td>`;
    row += `<td>${parsed.result_percent_of_pop_votes}%</td>`;
    row += `<td>${parsed.result_popular_votes_vs_seat_percent}%</td>`;

    //party with most seats
    let seats_party = JSON.parse(await get_request("info/party", { "party": parsed.result_party_with_most_seats })).data.party_name;
    row += `<td>${seats_party}</td>`;

    //winning party
    if (parsed.winning_party_id !== 0)
    {
        let winning_party = JSON.parse(await get_request("info/party", { "party": parsed.winning_party_id })).data.party_name;
        if (!winning_party) winning_party = "No Winner";
        row += `<td>${winning_party}</td>`;
    }
    else row += `<td>No winner</td>`;

    //final static value
    row += `<td>${parsed.result_winner_matches_real_winner ? "Yes" : "No"}</td>`;

    return row + "</tr>";
}

