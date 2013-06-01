<?php

/**
 * Handles matches and retrieving match results
 */

class Match extends CI_Model {
	
	function __construct() {
		parent::__construct();
		$this->load->database();
	}
	
	private function _convert($query, $get_results = false) {
		$items = array();
		if ($query->num_rows() > 0) {
			foreach ($query->result() as $row) {				
				if ($row->matchId)
					$row->teams = $this->get_match_teams($row->matchId);
				
				if ($get_results) 
					$row->results = $this->get_results_by_match($row->matchId);
				
				array_push($items, $row);
			}
		}
		return $items;
	}
	
	private function _convert_results($query) {
		$items = array();
		if ($query->num_rows() > 0) {
			foreach ($query->result() as $row) {				
				array_push($items, $row);
			}
		}
		return $items;
	}

	
	/**
	 * Gets a list of all matches
	 * @param bool $get_results If true, retrieves the match's results
	 * @return array
	 */
	function get_all($get_results = false) {
		$this->db->order_by('roundNum asc, matchNum asc');
		$query = $this->db->get('matches');
		return $this->_convert($query, $get_results);
	}
	
	/**
	 * Gets a match by its id
	 * @param int $id
	 * @param bool $get_results If true, retrieves the match's results
	 * @return array
	 */
	function get_by_id($id, $get_results = false) {
		return $this->get_where(array('matchId' => $id), $get_results);
	}
	
	/**
	 * Gets a match by its round and match number
	 * @param int $round
	 * @param int $match Use 0 or leave unused to retrieve all matches in a round
	 * @param bool $get_results If true, retrieves the match's results
	 * @return array
	 */
	function get_by_round($round, $match = 0, $get_results = false) {
		$params = array('roundNum' => $round);
		if ($match > 0) 
			$params['matchNum'] = $match;
		$this->db->order_by('matchNum asc');
		return $this->get_where($params, $get_results);
	}
	
	/**
	 * Gets a list of matches with a particular status
	 * @param string $status
	 * @param bool $get_results If true, retrieves the match's results
	 * @return array
	 */
	function get_by_status($status, $get_results = false) {
		$this->db->order_by('roundNum asc, matchNum asc');
		return $this->get_where(array('status' => $status), $get_results);
	}
	
	/**
	 * Gets a list of matches that are open
	 * @param bool $get_results If true, retrieves the match's results
	 * @return array
	 */
	function get_open_matches($get_results = false) {
		$this->db->order_by('roundNum asc, matchNum asc');
		return $this->get_where(array('open' => true), $get_results);
	}
	
	/**
	 * Gets a list of matches that are closed
	 * @param bool $get_results If true, retrieves the match's results
	 * @return array 
	 */
	function get_closed_matches($get_results = false) {
		$this->db->order_by('roundNum asc, matchNum asc');
		return $this->get_where(array('open' => false), $get_results);
	}
	
	/**
	 * Gets a list of matches by their properties
	 * @param array $params
	 * @param bool $get_results If true, retrieves the match's results
	 * @return array 
	 */
	function get_where($params, $get_results = false) {
		if (isset($params['matchId'])) {
			$params['matches.matchId'] = $params['matchId'];
			unset($params['matchId']);
		}
		
		$this->db->order_by('roundNum asc, matchNum asc');
		$query = $this->db->get_where('matches', $params);
		return $this->_convert($query, $get_results);
	}
	
	/**
	 * Gets the current match
	 * @param bool $get_results If true, retrieves the match's results
	 * @return array
	 */
	function get_current($get_results = false) {
		$this->db->where_in('status', array('ready', 'running', 'paused'));
		$query = $this->db->get('matches');
		return $this->_convert($query, $get_results);
	}
	
	
	function is_open($id) {
		$query = $this->db->get_where('matches', array('matchId' => $id));
		if ($query->num_rows() > 0) {
			return $query->row()->open != "0";
		}
		return false;
	}
	
	function update($id, $data) {
		if (isset($data['teams'])) {
			$this->db->where('matchId', $id)->delete('matchteams');
			foreach ($data['teams'] as $team) {
				$team['matchId'] = $id;
				$this->db->insert('matchteams', $team);
			}
			
			unset($data['teams']);
		}
		
		$this->db->where('matchId', $id);
		$this->db->update('matches', $data);
	}
	
	function create($data) {
		// Remove the "teams" property so it doesn't get stored in the matches table
		$teams = null;
		if (isset($data['teams'])) {
			$teams = $data['teams'];
			unset($data['teams']);
		}
		// Update the matches table
		$this->db->insert('matches', $data);
		
		$id = $this->db->insert_id();
		
		// Update the matchteams table
		if ($teams != null) {	
			foreach ($teams as $team) {
				$team['matchId'] = $id;
				$this->db->insert('matchteams', $team);
			}
		}
		
		// Update the matchresults table
		$this->reset_results($id);
		return $id;
	}
	
	function delete($id) {
		$this->db->where('matchId', $id);
		$this->db->delete('matches');
		
		$this->db->where('matchId', $id);
		$this->db->delete('matchteams');
	}
	
	
	/**
	 * Gets the teams playing in a match by its id
	 * @param int $matchId
	 * @return array 
	 */
	function get_match_teams($matchId) {
		$this->db->select('matchteams.teamId, matchteams.colorId'.
				  ', teams.name, teams.abbr, teams.imageName, teams.university');
		$this->db->join('teams', 'teams.teamId = matchteams.teamId');
		$query = $this->db->get_where('matchteams', array('matchId' => $matchId));
		
		$items = array();
		if ($query->num_rows() > 0) {
			foreach ($query->result() as $row) {
				array_push($items, $row);
			}
		}
		return $items;
	}
	
	/**
	 * Resets the results for a match, creating the database entries if necessary
	 * and optionally updating the results.
	 * @param type $matchId The match to reset
	 * @param type $update Optional: Set to true to update the results after resetting them
	 */
	function reset_results($matchId, $update = false) {
		$temp = $this->get_by_id($matchId);
		if (count($temp) == 0)
			return;
		
		$this->db->where('matchId', $matchId);
		$this->db->delete('matchresults');
		
		$match = $temp[0];
		foreach ($match->teams as $team) {
			$data = array(
				 'teamId' => $team->teamId,
				 'matchId' => $matchId,
				 'score' => 0,
				 'fouls' => 0,
				 'disqualified' => false
			);
			$this->db->insert('matchresults', $data);
		}
		
		if ($update) {
			$this->load->model('score', 'score');
			$this->score->update_results($matchId);
		}
	}
	
	
	/**
	 * Gets a list of all match results
	 * @return array
	 */
	function get_all_results() {
		$this->db->select('matchresults.*')->select('matchteams.colorId');
		$this->db->join('matchteams', 'matchteams.matchId = matchresults.matchId AND matchteams.teamId = matchresults.teamId', 'left');
		$query = $this->db->get('matchresults');
		return $this->_convert_results($query);
	}
	
	/**
	 * Gets the results of a match
	 * @param int $matchId
	 * @return array 
	 */
	function get_results_by_match($matchId, $teamId = 0) {
		$params = array( 'matchresults.matchId' => $matchId );
		if ($teamId > 0)
			$params['matchresults.teamId'] = $teamId;
		
		$this->db->select('matchresults.*')->select('matchteams.colorId');
		$this->db->join('matchteams', 'matchteams.matchId = matchresults.matchId AND matchteams.teamId = matchresults.teamId', 'left');
		$query = $this->db->get_where('matchresults', $params);
		return $this->_convert_results($query);
	}
	
	function get_results_by_current_match($teamId = 0) {
		$this->db->select('matchresults.*')->select('matchteams.colorId');
		$this->db->join('matchresults', 'matchresults.matchId = matches.matchId');
		$this->db->join('matchteams', 'matchteams.matchId = matchresults.matchId AND matchteams.teamId = matchresults.teamId', 'left');
		$this->db->where_in('status', array('ready', 'running', 'paused'));
		if ($teamId > 0)
			$this->db->where('matchresults.teamId', $teamId);
		
		$query = $this->db->get('matches');
		return $this->_convert_results($query);
	}
	
	/**
	 * Gets the results of all matches played by a team
	 * @param int $teamId
	 * @return array
	 */
	function get_results_by_team($teamId) {
		$this->db->select('matchresults.*')->select('matchteams.colorId');
		$this->db->join('matchteams', 'matchteams.matchId = matchresults.matchId AND matchteams.teamId = matchresults.teamId', 'left');
		$query = $this->db->get_where('matchresults', array('matchresults.teamId' => $teamId));
				  
		return $this->_convert_results($query);
	}
}


?>
