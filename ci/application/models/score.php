<?php

/**
 * Handles scoring and updating match results
 */

class Score extends CI_Model {
	
	
	function __construct() {
		parent::__construct();
		$this->load->database();
	}
	
	private function _convert($query, $get_results = false) {
		$items = array();
		if ($query->num_rows() > 0) {
			foreach ($query->result() as $row) {				
				array_push($items, $row);
			}
		}
		return $items;
	}
	
	private function _order() {
		$this->db->order_by('dateTime', 'asc');
	}
	
	private function _match_open($id) {
		$this->load->model('match', 'match');
		$item = $this->get_by_id($id);
		if (count($item) > 0) {
			return $this->match->is_open($item[0]->matchId);
		}
		return false;
	}
	
	/**
	 * Gets a list of all score entries
	 * @return array
	 */
	function get_all() {
		$this->_order();
		$query = $this->db->get('matchscorehistory');
		return $this->_convert($query);
	}
	
	function get_by_id($id) {
		return $this->get_where(array('id' => $id));
	}
	
	function get_by_match($matchId) {
		return $this->get_where(array('matchId' => $matchId));
	}
	
	function get_by_from_team($teamId, $matchId = 0) {
		$params = array('fromTeamId' => $teamId);
		if ($matchId > 0)
			$params['matchId'] = $matchId;
		return $this->get_where($params);
	}
	
	function get_by_on_team($teamId, $matchId = 0) {
		$params = array('onTeamId' => $teamId);
		if ($matchId > 0)
			$params['matchId'] = $matchId;
		return $this->get_where($params);
	}
	
	/**
	 * Gets a list of score entries by their properties
	 * @param array $params
	 * @return array 
	 */
	function get_where($params) {
		if (isset($params['actionId']) && $params['actionId'] == 'any') {
			unset($params['actionId']);
			$this->db->where('actionId !=', 0);
		}
		if (isset($params['foulId']) && $params['foulId'] == 'any') {
			unset($params['foulId']);
			$this->db->where('foulId !=', 0);
		}
		
		$this->_order();
		$query = $this->db->get_where('matchscorehistory', $params);
		return $this->_convert($query);
	}
	
	/**
	 * Gets the score entries for the current match
	 * @return array
	 */
	function get_by_current_match() {
		$this->db->select('matchscorehistory.*');
		$this->db->join('matchscorehistory', 'matchscorehistory.matchId = matches.matchId');
		$this->db->where_in('status', array('ready', 'running', 'paused'));
		$this->_order();
		$query = $this->db->get('matches');
		return $this->_convert($query);
	}
	
	/**
	 * Updates a score entry
	 * @param type $id
	 * @param type $data 
	 * @return boolean Returns true if updating succeeded or false if it failed
	 */
	function update($id, $data) {
		if ($this->_match_open($id)) {
			$this->db->where('id', $id);
			$this->db->update('matchscorehistory', $data);
			return true;
		}
		return false;
	}

	/**
	 * Creates a new score entry
	 * @param type $data
	 * @return int Returns the id of the created score or "false" if creation failed 
	 */
	function create($data) {
		$this->load->model('match', 'match');
		
		if (!isset($data['dateTime']) || !$data['dateTime']) {
			$data['dateTime'] = date('Y-m-d H:i:s');
		}
		
		if (!$this->match->is_open($data['matchId']))
			return false;
			
		$this->db->insert('matchscorehistory', $data);
		$id = $this->db->insert_id();
		
		$data['id'] = $id;
		$this->post_to_clock('new score', $data);
		return $id;
	}
	
	/**
	 * Deletes a score entry
	 * @param type $id The ID of the entry to delete
	 * @return boolean Returns true if successful or false if deletion failed
	 */
	function delete($id) {
		if ($this->_match_open($id)) {
			$this->db->where('id', $id);
			$this->db->delete('matchscorehistory');
			$this->post_to_clock('score deleted', array('id' => $id));
			return true;
		}
		return false;
	}
	
	/**
	 * Deletes all score entries for a match
	 * @param type $matchId The ID of the match to reset
	 * @return boolean Returns true if successful or false if deletion failed
	 */
	function deleteAll($matchId) {
		$this->load->model('match', 'match');
		
		if ($this->match->is_open($matchId)) {
			$this->db->where('matchId', $matchId);
			$this->db->delete('matchscorehistory');
			$this->post_to_clock('score deleted', array('id' => 0));
			return true;
		}
		return false;
	}
	
	/**
	 * Updates the results for a particular match
	 * @param type $matchId The id of the match to update.
	 * @param type $teamId The id of the team to update. Omit to update all teams
	 * @param type $actions Do not use (used by the function to reduce queries)
	 * @param type $fouls Do not use (used by the function to reduce queries)
	 */
	function update_results($matchId, $teamId = 0, $actions = null, $fouls = null) {
		$post_to_clock = false;
		
		// Get the game rules
		if ($actions == null || $fouls == null) {
			$post_to_clock = true;
			$this->load->model('rules', 'rules');
			$this->load->helper('arrays');
		
			$actions = index_by_prop($this->rules->get_actions(), 'actionId');
			$fouls = index_by_prop($this->rules->get_fouls(), 'foulId');
		}
		
		if ($teamId <= 0) {
			// If teamId = 0, update all teams in the match
			$teams = $this->db->get_where('matchteams', array('matchId' => $matchId));
			$results = array();
			if ($teams->num_rows() > 0) {
				foreach ($teams->result() as $team) {
					// if teamId is 0, calling update_results will recurse infinitely
					if ($team->teamId > 0)
						array_push($results, $this->update_results($matchId, $team->teamId, $actions, $fouls));
				}
			}
			//$this->post_to_clock('results changed', $results);
		}
		else {
			// Tally up the from/on values of each action/foul
			$from = $this->get_by_from_team($teamId, $matchId);
			$on = $this->get_by_on_team($teamId, $matchId);
			
			$score = 0;
			$foul_count = 0;
			$disabled = false;
			$disqualified = false;
			
			foreach ($from as $item) {
				if ($item->actionId > 0) {
					if ($actions[$item->actionId]) {
						$score += $actions[$item->actionId]->fromValue;
					}
					else
						show_error("Action $item->actionId does not exist.");
				}
				
				if ($item->foulId > 0) {
					if ($fouls[$item->foulId]) {
						$score += $fouls[$item->foulId]->value;
						$foul_count++;
					}
					else
						show_error("Foul $item->foulId does not exist.");
				}
				
				//print_r($item->disqualified);
				if ($item->disabled != 0)
					$disabled = true;
				if ($item->disqualified != 0)
					$disqualified = true;
			}
			
			foreach ($on as $item) {
				if ($item->actionId > 0) {
					if ($actions[$item->actionId]) {
						$score += $actions[$item->actionId]->onValue;
					}
					else
						show_error("Action $item->actionId does not exist.");
				}
			}
			
			
			// Write results back to the table.
			$this->db->flush_cache();
			$this->db->where(array('matchId' => $matchId, 'teamId' => $teamId));
			if ($this->db->count_all_results('matchresults') > 0) {
				// row exists. Update it.
				$this->db->flush_cache();
				$this->db->set('score', $score);
				$this->db->set('fouls', $foul_count);
				$this->db->set('disabled', $disabled);
				$this->db->set('disqualified', $disqualified);
				$this->db->where('teamId', $teamId)->where('matchId', $matchId);
				$this->db->update('matchresults');
			}
			else {
				$this->db->flush_cache();
				$this->db->set(array(
					 'matchId' => $matchId,
					 'teamId' => $teamId,
					 'score' => $score,
					 'fouls' => $foul_count,
					 'disabled' => $disabled,
					 'disqualified' => $disqualified
				));
				$this->db->insert('matchresults');
			}
			
			$results = array(
				'matchId' => $matchId,
				'teamId' => $teamId,
				'score' => $score,
				'fouls' => $foul_count,
				'disabled' => $disabled,
				'disqualified' => $disqualified
			);
			if ($post_to_clock)
				$this->post_to_clock('results changed', array($results));
			return $results;
		} //else $teamId <= 0
	}
	
	
	function post_to_clock($event, $data = array()) {
		$this->load->library('curl');
		$this->load->config('jsdc');
		$data = array_merge($data, array( 'event' => $event ));
		$this->curl->simple_post($this->config->item('jsdc_clock_address').'event/', $data);
	}
}


?>
