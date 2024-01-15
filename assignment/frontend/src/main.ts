async function test()
{
    get_request("test", { "name": "james", "age": "23" });
}

function update_display_for_results(results: string)
{
    let display = document.getElementById("test-display");

    if (display) display.innerHTML = JSON.stringify(results);
}

function event_select_change(event: Event)
{
    let system_id = event.target as HTMLSelectElement;

    if (system_id)
    {
        get_request("results", { "system": system_id.value }).then(response => update_display_for_results(response));
    }
}