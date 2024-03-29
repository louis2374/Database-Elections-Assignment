--all PKs use serial to auto generate, and the majority of names are unique (will cause conflict on duplicate)

--party table
CREATE TABLE tbl_parties (
    party_id SERIAL PRIMARY KEY,
    party_name VARCHAR(64) UNIQUE
);

--counties table
CREATE TABLE tbl_counties (
    county_id SERIAL PRIMARY KEY,
    county_name VARCHAR(64) UNIQUE
);

--regions table
CREATE TABLE tbl_regions (
    region_id SERIAL PRIMARY KEY,
    region_name VARCHAR(64) UNIQUE
);

--countries table
CREATE TABLE tbl_countries (
    country_id SERIAL PRIMARY KEY,
    country_name VARCHAR(64) UNIQUE
);

--constituency types table
CREATE TABLE tbl_constituency_types (
    type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(64) UNIQUE
);

--constituencies table
CREATE TABLE tbl_constituencies (
    constituency_id SERIAL PRIMARY KEY,
    constituency_name VARCHAR(64) UNIQUE,
    constituency_type INT,

    --foreign keys
    FOREIGN KEY (constituency_type) REFERENCES tbl_constituency_types(type_id)
);

--candidates table, holds compiled information about a candidate
CREATE TABLE tbl_candidates (
    candidate_id SERIAL PRIMARY KEY,
    candidate_forename VARCHAR(64),
    candidate_surname VARCHAR(64),
    candidate_gender VARCHAR(16),
    candidate_sitting_mp BOOLEAN,
    candidate_votes INT,
    party_id INT,
    county_id INT,
    region_id INT,
    country_id INT,
    constituency_id INT,

    --adding foreign keys
    FOREIGN KEY (party_id) REFERENCES tbl_parties(party_id),
    FOREIGN KEY (county_id) REFERENCES tbl_counties(county_id),
    FOREIGN KEY (region_id) REFERENCES tbl_regions(region_id),
    FOREIGN KEY (country_id) REFERENCES tbl_countries(country_id),
    FOREIGN KEY (constituency_id) REFERENCES tbl_constituencies(constituency_id)
);

--systems table
CREATE TABLE tbl_systems (
    system_id SERIAL PRIMARY KEY,
    system_name VARCHAR(128),
    system_desc VARCHAR(255)
);

--system results table
CREATE TABLE tbl_results (
    result_id SERIAL PRIMARY KEY,
    system_id INT UNIQUE,
    result_seats INT,
    result_popular_votes_vs_seat_percent FLOAT,
    result_percent_of_seats FLOAT,
    result_percent_of_pop_votes FLOAT,
    result_party_with_most_seats INT,
    winning_party_id INT,
    result_winner_matches_real_winner BOOLEAN,

    --define foreign keys
    FOREIGN KEY (system_id) REFERENCES tbl_systems(system_id),
    FOREIGN KEY (winning_party_id) REFERENCES tbl_parties(party_id),
    FOREIGN KEY (result_party_with_most_seats) REFERENCES tbl_parties(party_id)
);

--as i want independent paries to be differenciated easily, i will add a unique id, which i will manually increment to each one
--using a sequence to store the last independent name id
CREATE SEQUENCE independent_party_sequence START 1;

--insertion function, will ensure all required information exists for candidate, then insert the candidate
CREATE OR REPLACE FUNCTION insert_candidate(
    --just pass in all the required params
    v_forename VARCHAR(64),
    v_surname VARCHAR(64),
    v_gender VARCHAR(16),
    v_sitting_mp BOOLEAN,
    v_party_name VARCHAR(64),
    v_county_name VARCHAR(64),
    v_region_name VARCHAR(64),
    v_country_name VARCHAR(64),
    v_constituency_name VARCHAR(64),
    v_constituency_type VARCHAR(64),
    v_votes INT
) RETURNS VOID AS

--function is defined between these two sets of $$
$$
DECLARE
--stores the id of the inserted candidate for use when adding the vote data, saves a query
    v_candidate_id INT;

--group all statements
BEGIN
    --insert a type, duplicates are silently ignored
    INSERT INTO tbl_constituency_types (type_name) VALUES (v_constituency_type) ON CONFLICT DO NOTHING;

    --insert a constituency, duplicates are silently ignored
    INSERT INTO tbl_constituencies (constituency_name, constituency_type)
    VALUES (v_constituency_name, (SELECT type_id FROM tbl_constituency_types WHERE type_name = v_constituency_type))
    ON CONFLICT DO NOTHING;

    -- insert a county, ignores duplicates
    INSERT INTO tbl_counties (county_name) VALUES (v_county_name) ON CONFLICT DO NOTHING;

    --insert region
    INSERT INTO tbl_regions (region_name) VALUES (v_region_name) ON CONFLICT DO NOTHING;

    --insert a country
    INSERT INTO tbl_countries (country_name) VALUES (v_country_name) ON CONFLICT DO NOTHING;

    --insert a party and do nothing if it exists
    --there is a special case in which the party is independent.
    --for this i will add a number to the end and add it, so that 1 independent can be diffrenciated from the other
    IF v_party_name = 'Independent' THEN --if match
    v_party_name := v_party_name || nextval('independent_party_sequence'); --set name = to name + next sequence
    END IF;

    --insert into parties, possible with a new name
    INSERT INTO tbl_parties (party_name) VALUES (v_party_name) ON CONFLICT DO NOTHING;

    --create a candidate using all this new data
    --does a query for the ids of the foreign keys
    INSERT INTO tbl_candidates(
        candidate_forename,
        candidate_surname,
        candidate_gender,
        candidate_sitting_mp,
        candidate_votes,
        party_id,
        county_id,
        region_id,
        country_id,
        constituency_id
    ) VALUES (
        v_forename,
        v_surname,
        v_gender,
        v_sitting_mp,
        v_votes,
        (SELECT party_id FROM tbl_parties WHERE party_name = v_party_name),
        (SELECT county_id FROM tbl_counties WHERE county_name = v_county_name),
        (SELECT region_id FROM tbl_regions WHERE region_name = v_region_name),
        (SELECT country_id FROM tbl_countries WHERE country_name = v_country_name),
        (SELECT constituency_id FROM tbl_constituencies WHERE constituency_name = v_constituency_name)
        --returns the new id and saves into candidate_id var
    ) RETURNING candidate_id INTO v_candidate_id;

--end of group
END;
--end function code definition
$$

--i have to specify the lanuage otherwise it gives no lang specified error
LANGUAGE plpgsql;