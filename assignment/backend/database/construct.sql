--Party table
CREATE TABLE tbl_parties (
    party_id INT PRIMARY KEY,
    party_name VARCHAR(64)
);

--counties table
CREATE TABLE tbl_counties (
    county_id INT PRIMARY KEY,
    county_name VARCHAR(64)
);

--regions table
CREATE TABLE tbl_regions (
    region_id INT PRIMARY KEY,
    region_name VARCHAR(64)
);

--countries table
CREATE TABLE tbl_countries (
    country_id INT PRIMARY KEY,
    country_name VARCHAR(64)
);

--constituency types table
CREATE TABLE tbl_constituency_types (
    type_id INT PRIMARY KEY,
    type_name VARCHAR(64)
);

--constituencies table
CREATE TABLE tbl_constituencies (
    constituency_id INT PRIMARY KEY,
    constituency_name VARCHAR(64),
    constituency_type INT,

    --foreign keys
    FOREIGN KEY (constituency_type) REFERENCES tbl_constituency_types(type_id)
);

--candidates table, holds compiled information about a candidate
CREATE TABLE tbl_candidates (
    candidate_id INT PRIMARY KEY,
    candidate_forename VARCHAR(64),
    candidate_surname VARCHAR(64),
    candidate_sitting_mp BOOLEAN,
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

--votes table, stores vote information about each candidate
CREATE TABLE tbl_votes (
    vote_id INT PRIMARY KEY,
    vote_votes INT,
    candidate_id INT,

    --foreign keys
    FOREIGN KEY (candidate_id) REFERENCES tbl_candidates(candidate_id)
);

--systems table
CREATE TABLE tbl_systems (
    system_id INT PRIMARY KEY,
    system_name VARCHAR(128)
);

--system results table
CREATE TABLE tbl_results (
    result_id INT PRIMARY KEY,
    system_id INT,
    result_seats INT,
    result_popular_votes_vs_seat_percent FLOAT,
    result_percent_of_seats FLOAT,
    result_percent_of_pop_votes FLOAT,
    result_winner_matches_most_seats BOOLEAN,
    winning_party_id INT,
    result_most_seats_party INT,

    --define foreign keys
    FOREIGN KEY (system_id) REFERENCES tbl_systems(system_id),
    FOREIGN KEY (winning_party_id) REFERENCES tbl_parties(party_id),
    FOREIGN KEY (result_most_seats_party) REFERENCES tbl_parties(party_id)
);