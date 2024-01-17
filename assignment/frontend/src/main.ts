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

    let systems = ["fptp", "spr", "sprt5", "lr_county", "dh_country", "custom", "lr_region"];

    //object to store all system results
    let results: Array<{
        system: string,
        seats: number,
        percent_seats: number,
        percent_pop_votes: number,
        pop_vs_seats: number,
        most_seats: string,
        winner: string,
        matches_real_winner: string
    }> = new Array();

    //create a row for each query
    results = await Promise.all(systems.map(async (system) =>
    {
        let response: string = await get_request("results", { "system": system });
        return await create_table_row(response);
    }));


    //sort results
    results.sort((a, b) =>
    {
        return a.system.localeCompare(b.system);
    })



    //add each result to table
    results.map(result =>
    {
        table += "<tr>";

        table += `<td>${result.system}</td>`;
        table += `<td>${result.seats}</td>`;
        table += `<td>${result.percent_seats}</td>`;
        table += `<td>${result.percent_pop_votes}</td>`;
        table += `<td>${result.pop_vs_seats}</td>`;
        table += `<td>${result.most_seats}</td>`;
        table += `<td>${result.winner}</td>`;
        table += `<td>${result.matches_real_winner}</td>`;

        table += "</tr>";
    })

    table += "</tbody>";



    let table_div = document.getElementById("table_div");
    if (table_div) table_div.innerHTML = table;
}

async function create_table_row(results: string): Promise<{
    system: string,
    seats: number,
    percent_seats: number,
    percent_pop_votes: number,
    pop_vs_seats: number,
    most_seats: string,
    winner: string,
    matches_real_winner: string
}>
{
    let out: {
        system: string,
        seats: number,
        percent_seats: number,
        percent_pop_votes: number,
        pop_vs_seats: number,
        most_seats: string,
        winner: string,
        matches_real_winner: string
    } = {
        system: "",
        seats: 0,
        percent_seats: 0,
        percent_pop_votes: 0,
        pop_vs_seats: 0,
        most_seats: "",
        winner: "",
        matches_real_winner: ""
    };

    //parse result
    let parsed = JSON.parse(results)["data"]["result"];

    //get system desc
    out.system = JSON.parse(await get_request("info/system", { "system": parsed.system_id })).data.system_desc;

    //add static values
    out.seats = parsed.result_seats;
    out.percent_seats = parsed.result_percent_of_seats;
    out.percent_pop_votes = parsed.result_percent_of_pop_votes;
    out.pop_vs_seats = parsed.result_popular_votes_vs_seat_percent;

    //party with most seats
    out.most_seats = JSON.parse(await get_request("info/party", { "party": parsed.result_party_with_most_seats })).data.party_name;

    //winning party
    let winning_party = JSON.parse(await get_request("info/party", { "party": parsed.winning_party_id })).data.party_name;
    if (!winning_party) winning_party = "No Winner";
    out.winner = winning_party;

    //final static value
    out.matches_real_winner = parsed.result_winner_matches_real_winner ? "Yes" : "No";

    return out;
}


create_result_table();