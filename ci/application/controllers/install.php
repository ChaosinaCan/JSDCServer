<?php defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * JDSC REST API
 */


class Install extends CI_Controller {
	
	public function __construct() {
		parent::__construct();
		$this->load->helper('html');
		$this->load->helper('url');
	}
	
	public function index() {		
		$this->load->model('configeditor', 'cfg');
		$this->cfg->set_db('default.db_debug', false);
		$this->load->model('database');
		
		// Try connecting
		$db = $this->database->connect();
		if ($db && $db->username) {
			// If success, check that JSDC database exists
			$this->load->database();
			$this->load->dbutil();
			if ($this->db->database == 'jsdc' && $this->dbutil->database_exists('jsdc')) {
				// If yes, check that its structure is okay
				if ($this->_check_structure()) {
					$this->_finished_page();
				} else {
					$this->_design_database_page();
				}
			} else {
				$this->_create_database_page();
			}
		} else {
			// Get new credentials
			$username = $this->input->post('username');
			$password = $this->input->post('password');
		
			if ($username && $password) {
				// Test new credentials
				$this->cfg->set_db('default.username', $username);
				$this->cfg->set_db('default.password', $password);
				$config = array(
					'hostname' => $this->db->hostname,
					'username' => $username,
					'password' => $password,
					'database' => 'jsdc',
					'dbdriver' => 'mysql',
					'db_debug' => FALSE,
					'pconnect' => TRUE,
				);
				
				if ($this->database->connect($config)) {
					// If connected, go to next step
					redirect('/install/', 'location', 302);
				} else {
					$this->_connect_database_page(true);
				}
				
			} else {
				$this->_connect_database_page();
			}
		}
		
		$this->cfg->set_db('default.db_debug', true);
	}
	
	private function _view($view, $data=null) {
		$this->load->view('install/header');
		$this->load->view('install/' . $view, $data);
		$this->load->view('install/footer');
	}
	
	private function _connect_database_page($invalid_credentials = false) {
		$this->_view('login', array('invalid_credentials' => $invalid_credentials));
	}
	
	private function _create_database_page() {
		echo $this->load->view('install/header', null, true);	
		echo '<p>Creating database...</p>';
		flush();
		
		$this->database->create_database();
		$this->load->model('configeditor', 'cfg');
		$this->cfg->set_db('default.database', 'jsdc');
		echo '<p>Done.</p>';
		echo '<script>window.location.reload()</script>';
		echo $this->load->view('install/footer', null, true);
	}
	
	private function _design_database_page() {
		echo $this->load->view('install/header', null, true);
		echo '<p>Setting up database...</p>';
		flush();
		
		$this->database->design_database();
		echo '<p>Done.</p>';
		echo '<script>window.location.reload()</script>';
		echo $this->load->view('install/footer', null, true);
	}
	
	private function _finished_page() {
		$this->_view('finished');
	}

	private function _check_structure() {
		$tables = array('actions', 'apikeys', 'colors', 'fouls', 'matches', 
			'matchresults', 'matchscorehistory', 'matchteams', 'permissions',
			'teams', 'users', 'usersapi', 'usersteams');
		
		foreach ($tables as $table) {
			if (!$this->db->table_exists($table)) {
				return false;
			}
		}
		return true;
	}
	
}
?>