<?php defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * JDSC REST API
 */


class Scoring extends CI_Controller {
	
	
	public function __construct() {
		parent::__construct();
		
		$this->load->helper('html');
		$this->load->helper('url');
		$this->load->helper('cookie');
		$this->load->config('jsdc');
		$this->load->model('match', 'matches');
	}
	
	public function index() {
		// if not logged in, show the login page
		if (!$this->_is_logged_in()) {
			$this->_set_selected_match(0);
			$this->_set_selected_team(0);
			$this->_show_login();
			return;
		}
		else {
			$set_team = $this->input->get('team');
			if ($set_team !== false) {
				$this->_set_selected_team($set_team);
				$this->_redirect();
				return;
			}
			
			$match = $this->_get_selected_match();
			$current = $this->_get_current_match();
			$team = $this->_get_selected_team();
			
			// If there is no current match, show an error
			if ($current == null) {
				$this->_show_no_match_error();
				return;
			}
			
			// check if a match is selected. If not, pick the current match
			if ($match == null) {
				$match = $this->_get_current_match();
				$this->_set_selected_match($match->matchId);
			}
				
			// if the current match isn't the current one, unset the selected team
			if ($match->matchId != $current->matchId) {
				$team = null;
				$this->_set_selected_team(0);
				$match = $this->_get_current_match();
				$this->_set_selected_match($match->matchId);
			}
			
			// If no team is selected or the current team is not playing, show
			// the team select page.
			if ($team == null || !$this->_is_team_playing($match, $team)) {
				$this->_show_teamselect($match);
				return;
			}
			
			$this->_show_main($match, $team);
		}
	}
	
	public function devicetest() {
		$data = array(
			'clock_address' => $this->config->item('jsdc_clock_address'),
		);
		$this->load->view('scoring/devicetest', $data);
	}
	
	public function logout() {
		//TODO: Actually logout
		$this->_set_selected_match(0);
		$this->_set_selected_team(0);
		$this->_redirect();
	}
	
	public function teamselect() {
		$this->_set_selected_team(0);
		$this->_redirect();
	}
	
	
	private function _redirect() {
		redirect('/scoring/');
	}
			  
	private function _is_logged_in() {
		// TODO: Actually check something here
		return true;
	}
	
	private function _is_team_playing($match, $team) {
		for ($i = 0; $i < count($match->teams); $i++) {
			if ($match->teams[$i]->teamId == $team)
				return true;
		}
		return false;
	}
	
	private function _get_selected_match() {
		$cookie = get_cookie('match');
		if ($cookie === false)
			return null;
		
		$match = $this->matches->get_by_id($cookie);
		if (count($match) == 0)
			return null;
		
		return $match[0];
	}
	
	private function _set_selected_match($matchId) {
		if ($matchId == 0) {
			delete_cookie('match');
			return;
		}
		
		$cookie = array(
			 'name' => 'match',
			 'value' => $matchId,
			 'expire' => 10 * 60, // keep the selected match for 10 minutes
		);
		set_cookie($cookie);
	}
	
	private function _get_selected_team() {
		$cookie = get_cookie('team');
		if ($cookie === false)
			return null;
		return $cookie;
	}
	
	private function _set_selected_team($teamId) {
		if ($teamId == 0) {
			delete_cookie('team');
			return;
		}
		
		$cookie = array(
			 'name' => 'team',
			 'value' => $teamId,
			 'expire' => 10 * 60, // keep the selected match for 10 minutes
		);
		set_cookie($cookie);
	}
	
	private function _get_current_match() {
		$current = $this->matches->get_current();
		if (count($current) == 0)
			return null;
		
		return $current[0];
	}
	
	
	
	
	private function _show_login() {
		$this->load->view('scoring/login');
	}
	
	private function _show_no_match_error() {
		$data = array(
			'clock_address' => $this->config->item('jsdc_clock_address'),
		);
		$this->load->view('scoring/error-match', $data);	}
	
	private function _show_teamselect($match) {
		$this->load->model('rules', 'rules');
		$this->load->helper('arrays');
		
		$data = array(
			'match' => $match,
			'colors' => index_by_prop($this->rules->get_colors(), 'colorId'),
			'clock_address' => $this->config->item('jsdc_clock_address'),
		);

		$this->load->view('scoring/teamselect', $data);
	}
	
	private function _show_main($match, $teamId) {
		$this->load->model('team', 'teams');
		$this->load->model('rules', 'rules');
		$this->load->helper('arrays');
		
		$teamData = $this->teams->get_by_id($teamId);
		
		$data = array(
			'clock_address' => $this->config->item('jsdc_clock_address'),
			'match' => $match,
			'colors' => $this->rules->get_colors(),
			'actions' => $this->rules->get_actions(),
			'fouls' => $this->rules->get_fouls(),
			'team' => $teamData[0],
			'color' => 'unknown',
		);
		
		$colors_by_id = index_by_prop($data['colors'], 'colorId');
		
		// Determine the color name of the current team
		for ($i = 0; count($i < $match->teams); $i++) {
			if ($match->teams[$i]->teamId == $teamId) {
				$data['color'] = $colors_by_id[$match->teams[$i]->colorId]->name;
				break;
			}
		}
		
		$this->load->view('scoring/main', $data);
	}
}