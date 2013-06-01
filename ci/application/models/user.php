<?php

class User extends CI_Model {
	
	var $columns = 'users.userId, users.username, users.email, users.fullname, users.ip, users.pId, usersapi.apiId';
	
	function __construct() {
		parent::__construct();
		$this->load->database();
	}
	
	private function _convert($query, $expand = false) {
		$items = array();
		if ($query->num_rows() > 0) {
			foreach ($query->result() as $row) {
				if ($expand)
					$this->_expand($row);
				
				array_push($items, $row);
			}
		}
		return $items;
	}
	
	private function _expand($item) {
		$perm = $this->get_permissions($item->pId);
		if ($perm) {
			$item->permissions = $perm;
		}
		
		if (isset($item->apiId)) {
			$apikey = $this->get_api_key($item->apiId);
			if ($apikey) {
				$item->apikey = $apikey;
			}
		}

	}
	
	private function _select() {
		$this->db->select($this->columns);
	}
	
	
	/**
	 * Gets a list of all users
	 * @param bool $expand If true, retrieves each user's api keys and permissions objects
	 * @return array 
	 */
	function get_all($expand = false) {
		$this->_select();
		$this->db->join('usersapi', 'usersapi.userId = users.userId', 'left');
		$query = $this->db->get('users');
		return $this->_convert($query, $expand);
	}
	
	/**
	 * Gets a user by id
	 * @param int $id
	 * @param bool $expand If true, retrieves each user's api keys and permissions objects
	 * @return array 
	 */
	function get_by_id($id, $expand = false) {
		$this->_select();
		return $this->get_where(array('users.userId' => $id), $expand);
	}
	
	/**
	 * Gets a user by username
	 * @param string $name
	 * @param bool $expand If true, retrieves each user's api keys and permissions objects
	 * @return array 
	 */
	function get_by_username($name, $expand = false) {
		$this->_select();
		return $this->get_where(array('username' => $id), $expand);
	}
	
	/**
	 * Gets a user by email
	 * @param string $email
	 * @param bool $expand If true, retrieves each user's api keys and permissions objects
	 * @return array 
	 */
	function get_by_email($email, $expand = false) {
		$this->_select();
		return $this->get_where(array('email' => $email), $expand);
	}
	
	/**
	 * Gets a user by its properties
	 * @param array $params
	 * @param bool $expand If true, retrieves each user's api keys and permissions objects
	 * @return array
	 */
	function get_where($params, $expand = false) {
		if (isset($params['userId'])) {
			$params['users.userId'] = $params['userId'];
			unset($params['userId']);
		}
		
		$this->db->join('usersapi', 'usersapi.userId = users.userId', 'left');
		$query = $this->db->get_where('users', $params);
		return $this->_convert($query, $expand);
	}
	
	/**
	 * Gets a user by the api key associated with it
	 * @param string $apikey
	 * @param bool $expand If true, retrieves each user's api keys and permissions objects
	 * @return array 
	 */
	function get_by_api_key($apikey, $expand = false) {
		//$this->db->select($this->columns . ', usersapi.apiId');
		$this->_select();
		$this->db->join('usersapi', 'usersapi.apiId = apikeys.id', 'right');
		$this->db->join('users', 'usersapi.userId = users.userId', 'right');
		$query = $this->db->get_where('apikeys', array('key' => $apikey));
		if ($query->num_rows() > 0) {
			return $this->_convert($query, $expand);
		}
		return array();
	}
	
	/**
	 * Gets a user by the id of the api key associated with it
	 * @param int $apiId
	 * @param bool $expand If true, retrieves each user's api keys and permissions objects
	 * @return array
	 */
	function get_by_api_id($apiId, $expand = false) {
		$this->db->join('users', 'usersapi.userId = users.userId', 'right');
		$query = $this->db->get_where('usersapi', array('apiId' => $apiId));
		if ($query->num_rows() > 0) {
			return $this->_convert($query, $expand);
		}
		return array();
	}
	
	/**
	 * Gets a permissions object by its id
	 * @param int $pId
	 * @return object 
	 */
	function get_permissions($pId) {
		$query = $this->db->get_where('permissions', array('pId' => $pId));
		if ($query->num_rows() > 0) {
			$temp = $query->result();
			return $temp[0];
		}
		return null;
	}
	
	function get_all_permissions() {
		$query = $this->db->get('permissions');
		return $this->_convert($query);
	}
	
	/**
	 * Gets an api key object by its id
	 * @param int $apiId
	 * @return object
	 */
	function get_api_key($apiId) {
		$query = $this->db->get_where('apikeys', array('id' => $apiId));
		if ($query->num_rows() > 0) {
			$temp = $query->result();
			return $temp[0];
		}
		return null;
	}
	
	/**
	 * Gets an api key object by the id of the user associated with it
	 * @param ing $userId
	 * @return object
	 */
	function get_api_key_by_user($userId) {
		$this->db->select('apikeys.*');
		$this->db->join('apikeys', 'apikeys.id = usersapi.apiId');
		$query = $this->db->get_where('usersapi', array('userId' => $userId));
		
		if ($query->num_rows() > 0) {
			$temp = $query->result();
			return $temp[0];
		}
		return null;
	}
}


?>
