<?php

class Database extends CI_Model {
	
	public function __construct() {
		parent::__construct();
	}
	
	function connect($config='default') {
		try {
			$db = $this->load->database($config, true);
			if ($db->conn_id) {
				return $db;
			} else {
				return false;
			}
		} catch (Exception $e) {
			return false;
		}
	}
	
	function needs_install() {
		
	}
	
	function set_db_name($name) {
		$this->load->model('configeditor', 'cfg');
		$this->cfg->set_db('default.database', $name);
	}
	
	function set_db_credentials($username, $password) {
		$this->load->model('configeditor', 'cfg');
		$this->cfg->set_db('default.username', $username);
		$this->cfg->set_db('default.password', $password);
	}
	
	function create_database() {
		$this->load->database();
		$this->load->dbforge();
		$this->dbforge->create_database('jsdc');
	}
	
	private function _nullable($type) {
		$newType = $type;
		$newType['null'] = true;
		$newType['default'] = null;
		return $newType;
	}
	
	private function _batch($names) {
		$data = array();
		$values = array_slice(func_get_args(), 1);
		foreach ($values as $value) {
			$item = array();
			for ($i = 0; $i < count($names); ++$i) {
				$item[$names[$i]] = $value[$i];
			}
			array_push($data, $item);
		}
		return $data;
	}
	
	function design_database() {
		$this->load->database();
		$this->load->dbforge();
		$forge = $this->dbforge;
		
		$id_type = array(
			'type' => 'int',
			'constraint' => 11,
			'unsigned' => true,
			'auto_increment' => true,
		);
		
		$other_id_type = array(
			'type' => 'int',
			'constraint' => 11,
			'unsigned' => true,
		);
		
		$optional_other_id_type = array(
			'type' => 'int',
			'constraint' => 11,
			'unsigned' => true,
			'default' => 0,
		);
		
		$bool_type = array(
			'type' => 'tinyint',
			'constraint' => 1,
			'default' => 0,
		);
		
		$int_type = array(
			'type' => 'int',
			'constraint' => 11,
			'default' => 0,
		);
		
		$string_type = array(
			'type' => 'varchar',
			'constraint' => 45,
		);
		
		// create tables
		$forge->add_field(array(
			'actionId' => $id_type,
			'fromValue' => $int_type,
			'onValue' => $int_type,
			'name' => $string_type,
		));
		$forge->add_key('actionId', true);
		$forge->create_table('actions', true);
		
		$forge->add_field(array(
			'id' => $id_type,
			'key' => $string_type,
			'level' => array(
				'type' => 'int',
				'constraint' => 2,
			), 
			'ignore_limits' => array(
				'type' => 'tinyint',
				'constraint' => 1,
				'default' => 0,
			),
			'date_created' => $int_type,
		));
		$forge->add_key('id', true);
		$forge->create_table('apikeys', true);
		
		$forge->add_field(array(
			'colorId' => $id_type,
			'name' => $string_type,
		));
		$forge->add_key('colorId', true);
		$forge->create_table('colors', true);
		
		$forge->add_field(array(
			'foulId' => $id_type,
			'value' => $int_type,
			'name' => $string_type,
		));
		$forge->add_key('foulId', true);
		$forge->create_table('fouls', true);
		
		$forge->add_field(array(
			'matchId' => $id_type,
			'open' => $bool_type,
			'status' => array(
				'type' => 'enum',
				'constraint' => array('none', 'ready', 'running', 'paused', 'finished'),
				'default' => 'none',
			),
			'roundNum' => $int_type,
			'matchNum' => $int_type,
		));
		$forge->add_key('matchId', true);
		$forge->create_table('matches', true);
		
		$forge->add_field(array(
			'id' => $id_type,
			'teamId' => $other_id_type,
			'matchId' => $other_id_type,
			'score' => $int_type,
			'fouls' => $int_type,
			'disabled' => $bool_type,
			'disqualified' => $bool_type,
		));
		$forge->add_key('id', true);
		$forge->create_table('matchresults', true);
		
		$forge->add_field(array(
			'id' => $id_type,
			'matchId' => $other_id_type,
			'fromTeamId' => $other_id_type,
			'onTeamId' => $other_id_type,
			'actionId' => $optional_other_id_type,
			'foulId' => $optional_other_id_type,
			'apiId' => $other_id_type,
			'dateTime' => array('type' => 'datetime'),
			'disabled' => $bool_type,
			'disqualified' => $bool_type,
		));
		$forge->add_key('id', true);
		$forge->create_table('matchscorehistory', true);
		
		$forge->add_field(array(
			'id' => $id_type,
			'matchId' => $other_id_type,
			'teamId' => $other_id_type,
			'colorId' => $other_id_type,
		));
		$forge->add_key('id', true);
		$forge->create_table('matchteams', true);
		
		$forge->add_field(array(
			'pId' => $id_type,
			'name' => $this->_nullable($string_type),
		));
		$forge->add_key('pId', true);
		$forge->create_table('permissions', true);
		
		$forge->add_field(array(
			'teamId' => $id_type,
			'name' => $string_type,
			'abbr' => array(
				'type' => 'varchar',
				'constraint' => 5,
				'null' => true,
				'default' => null,
			),
			'bio' => array(
				'type' => 'longtext', 
				'null' => true,
				'default' => null,
			),
			'imageName' => $this->_nullable($string_type),
			'deposit' => $bool_type,
			'university' => $string_type,
			'registrationDate' => array('type' => 'date'),
		));
		$forge->add_key('teamId', true);
		$forge->create_table('teams', true);
		
		$forge->add_field(array(
			'userId' => $id_type,
			'username' => $string_type,
			'password' => $string_type,
			'email' => $string_type,
			'fullname' => $this->_nullable($string_type),
			'ip' => array(
				'type' => 'varchar',
				'constraint' => 37,
				'null' => true,
				'default' => null,
			),
			'pId' => $other_id_type,
		));
		$forge->add_key('userId', true);
		$forge->create_table('users', true);
		$this->db->query('CREATE UNIQUE INDEX name_UNIQUE ON users (username)');
		$this->db->query('CREATE UNIQUE INDEX email_UNIQUE ON users (email)');
		
		$forge->add_field(array(
			'apiId' => $other_id_type,
			'userId' => $other_id_type,
		));
		$forge->add_key('userId', true);
		$forge->create_table('usersapi', true);
		
		$forge->add_field(array(
			'userId' => $other_id_type,
			'teamId' => $other_id_type,
		));
		$forge->add_key('userId', true);
		$forge->create_table('usersteams', true);	
		
		// add default values
		$this->db->insert('apikeys', array(
			'id' => 1,
			'key' => 'JSDC4Life',
			'level' => 0,
			'ignore_limits' => 0,
			'date_created' => 0,
		));
		
		$this->db->insert_batch('colors', $this->_batch(
			array('colorId', 'name'),
			array(1, 'red'),
			array(2, 'green'),
			array(3, 'yellow'),
			array(4, 'blue')
		));
		
		$this->db->insert_batch('fouls', $this->_batch(
			array('foulId', 'value', 'name'),
			array(1, -10, 'Personal'),
			array(2, -50, 'Technical'),
			array(3, 0, 'Flagrant')
		));
	}
}

?>
