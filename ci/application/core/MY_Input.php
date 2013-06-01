<?php if ( ! defined('BASEPATH')) exit('No direct script access allowed');

class MY_Input extends CI_Input {
	
	public function __construct() {
		parent::__construct();
		
		// Populate $_POST with variables from JSON request body
		$type = parent::server('CONTENT_TYPE');
		$method = strtolower(parent::server('REQUEST_METHOD'));
		
		if (stristr($type, 'json') && $method == 'post') {
			$vars = json_decode(file_get_contents('php://input'), true);
			
			if (count($vars) > 0)
				$_POST = array_merge($vars, $_POST);
		}
	}
}
?>
