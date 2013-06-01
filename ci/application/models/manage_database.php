<?php

class Manage_Database extends CI_Model {

	public function __construct() {
		parent::__construct();
		$this->load->database();
	}
	
	function create_database($import_file, $repair = false) {
		$this->load->helper('file');
		
		// Load the schema file, split it into queries and execute each one.
		
		$sql_import = read_file($import_file);
		$queries = explode(';', $sql_import);
		$this->db->query('SET FOREIGN_KEY_CHECKS = 0');

		foreach ($queries as $query) {
			if (trim($query) != '')
				$this->db->query($query);
		}

		$this->db->query('SET FOREIGN_KEY_CHECKS = 1');
		
		if ($repair)
			return;
		
		//TODO: Set up default values
		//$this->load->model('jsdc/rules', 'rules');
		
		
		
	}

}
?>
