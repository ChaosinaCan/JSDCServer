<?php defined('BASEPATH') OR exit('No direct script access allowed');

/*
|--------------------------------------------------------------------------
| JSDC Clock address
|--------------------------------------------------------------------------
|
| What is the address and port of the clock controller?
| If this is left as localhost:8080, other clients will not be able to connect
| to the clock, so change this to the IP address of the server
| (e.g. http://192.168.0.42:8080/)
|
|	Default: http://localhost:8080/
|
*/
$config['jsdc_clock_address'] = 'http://localhost:8080/';

/*
|--------------------------------------------------------------------------
| Teams Per Match
|--------------------------------------------------------------------------
|
| How many teams (maximum) can play in each match?
|
|	Default: 4
|
*/
$config['teams_per_match'] = 4;

/*
|--------------------------------------------------------------------------
| Maximum Rounds
|--------------------------------------------------------------------------
|
| How many rounds (maximum) should be in the tournament?
|
|	Default: 8
|
*/
$config['max_rounds'] = 8;

/*
|--------------------------------------------------------------------------
| Maximum Matches
|--------------------------------------------------------------------------
|
| How many matches (maximum) should be in each round?
|
|	Default: 16
|
*/
$config['max_matches'] = 16;


/* End of file config.php */
/* Location: ./application/config/jsdc.php */