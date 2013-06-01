<?php

class Team extends CI_Model {
	
	function __construct() {
		parent::__construct();
		$this->load->database();
	}
	
	private function _convert($query) {
		$items = array();
		if ($query->num_rows() > 0) {
			foreach ($query->result() as $row) {
				array_push($items, $row);
			}
		}
		return $items;
	}
	
	private function _order() {
		$this->db->order_by('name', 'asc');
	}
	
	
	/**
	 * Gets an array of all the teams
	 * @return type 
	 */
	function get_all() {
		$this->_order();
		$query = $this->db->get('teams');
		return $this->_convert($query);
	}
	
	/**
	 * Gets a team by its id
	 * @param int $id
	 * @return type 
	 */
	function get_by_id($id) {
		return $this->get_where(array('teamId' => $id));
	}
	
	/**
	 * Gets a list of teams by their properties
	 * @param array $params
	 * @return type 
	 */
	function get_where($params) {
		$this->_order();
		$query = $this->db->get_where('teams', $params);
		return $this->_convert($query);
	}
	
	function create($data) {	
		if (!isset($data['registrationDate']) || !$data['registrationDate']) 
			$data['registrationDate'] = date('Y-m-d H:i:s');
		
		if (!isset($data['deposit']))
			$data['deposit'] = 0;
			
		$this->db->insert('teams', $data);
		return $this->db->insert_id();
	}
	
	function update($id, $data) {
		$this->db->where('teamId', $id);
		$this->db->update('teams', $data);
	}
	
	function delete($id) {
		$this->db->where('teamId', $id);
		$this->db->delete('teams');
	}
}


?>
