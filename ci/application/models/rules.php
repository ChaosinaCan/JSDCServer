<?php

class Rules extends CI_Model {
	
	function __construct() {
		parent::__construct();
		$this->load->database();
	}
	
	private function _convert($query, $single = false) {
		$items = array();
		if ($query->num_rows() > 0) {
			foreach ($query->result() as $row) {
				array_push($items, $row);
			}
		}
		if ($single) {
			if (count($items) > 0)
				return $items[0];
			else
				return null;
		}
		return $items;
	}

	function get_actions() {
		$query = $this->db->get('actions');
		return $this->_convert($query);
	}
	
	function get_action_by_id($id, $single = true) {
		$query = $this->db->get_where('actions', array('actionId' => $id));
		return $this->_convert($query, $single);
	}
	
	function create_action($data) {
		$this->db->insert('actions', $data);
		return $this->db->insert_id();
	}
	
	function update_action($id, $data) {
		$this->db->where('actionId', $id);
		$this->db->update('actions', $data);
	}
	
	function delete_action($id) {
		$this->db->where('actionId', $id);
		$this->db->delete('actions');
	}
	
	function get_fouls() {
		$query = $this->db->get('fouls');
		return $this->_convert($query);
	}
	
	function get_foul_by_id($id, $single = true) {
		$query = $this->db->get_where('fouls', array('foulId' => $id));
		return $this->_convert($query, $single);
	}
	
	function create_foul($data) {
		$this->db->insert('fouls', $data);
		return $this->db->insert_id();
	}
	
	function update_foul($id, $data) {
		$this->db->where('foulId', $id);
		$this->db->update('fouls', $data);
	}
	
	function delete_foul($id) {
		$this->db->where('foulId', $id);
		$this->db->delete('fouls');
	}
	
	function get_colors() {
		$query = $this->db->get('colors');
		return $this->_convert($query);
	}
	
	function get_color_by_id($id, $single = true) {
		$query = $this->db->get_where('colors', array('colorId' => $id));
		return $this->_convert($query, $single);
	}
	
	function create_color($data) {
		$this->db->insert('colors', $data);
		return $this->db->insert_id();
	}
	
	function update_color($id, $data) {
		$this->db->where('colorId', $id);
		$this->db->update('colors', $data);
	}
	
	function delete_color($id) {
		$this->db->where('colorId', $id);
		$this->db->delete('colors');
	}
	
}


?>
