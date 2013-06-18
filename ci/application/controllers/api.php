<?php defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * JDSC REST API
 */

define('THUMB_SIZE', 180);

// This can be removed if you use __autoload() in config.php OR use Modular Extensions
require APPPATH.'/libraries/REST_Controller.php';

class API extends REST_Controller {
	
	private function _resp_ok($data = null) {
		$this->response($data !== null ? $data : 'OK', 200);
	}
	
	private function _resp_created($data = null) {
		$this->response($data !== null ? $data : 'Created', 201);
	}
	
	private function _resp_deleted($data = null) {
		$this->response($data !== null ? $data : 'Deleted', 204);
	}
	
	private function _resp_bad_request($data = null) {
		$this->response($data !== null ? $data : 'Bad Request', 400);
	}
	
	private function _resp_scoring_closed() {
		$this->_resp_bad_request('Scoring is Closed');
	}
	
	private function _resp_not_found($data = null) {
		$this->response($data !== null ? $data : 'Not Found', 404);
	}
	
	function ping_get() {
		$this->_resp_ok();
	}
	
	function ping_post() {
		$method = $this->post('method');
		if ($method == 'ping') 
			$this->_resp_ok();
		else
			$this->_resp_bad_request();
	}
	
	
	function user_get() {
		$this->load->model('user', 'model');
		$this->load->helper('addprop');
		$expand = $this->get('expand') !== false;
		
		if ($this->get('all') !== false) {
			$result = $this->model->get_all($expand);
			$this->_resp_ok($result);
		}
		else if ($this->get('apikey')) {
			$result = $this->model->get_by_api_key($this->get('apikey'), $expand);
			$this->_resp_ok($result);
		}
		else {
			$params = getprops($this, array(
				 'userId' => 'id',
				 'username' => 'username',
				 'email' => 'email'
			));
			
			if ($params === array())
				$this->_resp_bad_request();
			else {
				$result = $this->model->get_where($params, $expand);
				$this->_resp_ok($result);
			}
		}
	}
	
	
	
	
	function team_get() {
		$this->load->model('team', 'model');

		if ($this->get('all') !== false) {
			$result = $this->model->get_all();
			$this->_resp_ok($result);
		}
		else if ($this->get('id')) {
			$result = $this->model->get_by_id($this->get('id'));
			$this->_resp_ok($result);
		}
		else {
			$this->_resp_bad_request();
		}
	}
	
	function team_post() {
		$this->load->model('team', 'model');
		$this->load->helper('addprop');
		
		$method = $this->post('method');
		$params = postprops($this, array(
			'name' => 'name',
			'abbr' => 'abbr',
			'bio' => 'bio',
			'university' => 'university',
			'imagename' => 'imageName',
		));
		
		switch ($method) {
			case 'create':
				if (!props_defined($params, array('name', 'university'))) {
					$this->_resp_bad_request('name and university Required');
				} else {
					$id = $this->model->create($params);
					
					if (isset($_FILES['imagedata'])) {
						$params = array();
						$params['imageName'] = $this->_upload_image($id);
						$this->model->update($id, $params);
					}
					
					$this->_resp_created(array( 'teamId' => $id ));
				}
				break;
			
			case 'update':
				$id = $this->post('id');
				
				if ($id === false) {
					$this->_resp_bad_request('id Required');
				} else {
					if (isset($_FILES['imagedata'])) {
						$params['imageName'] = $this->_upload_image($id);
					}
					
					$this->model->update($id, $params);
					$this->_resp_ok($this->model->get_by_id($id));
				}
				break;
				
			case 'delete':
				$id = $this->post('id');
				if ($id === false) {
					$this->_resp_bad_request('id Required');
				} else {
					$this->model->delete($id);
					$this->_resp_deleted();
				}
				break;
			
			default:
				$this->_resp_bad_request('Unknown Method');
		}
	}
	
	
	private function _upload_image($id) {
		$dir = $_SERVER['DOCUMENT_ROOT'] . '/uploads';
		$name = 'team-' . $id;
		
		// Upload the image
		$config = array(
			'upload_path' => $dir,
			'allowed_types' => 'gif|jpg|png',
			'max_size' => 0,
			'file_name' => $name,
			'overwrite' => true,
		);
		
		$this->load->library('upload', $config);
		$this->upload->do_upload('imagedata');
		
		// Create a thumbnail
		$data = $this->upload->data();
		
		$config = array(
			'image_library' => 'gd2',
			'source_image' => $data['full_path'],
			'maintain_ratio' => true,
			'create_thumb' => true,
			'thumb_marker' => '-thumb',
			'height' => THUMB_SIZE,
			'width' => THUMB_SIZE,
		);
		
		$this->load->library('image_lib', $config);
		$this->image_lib->resize();
		
		return $data['file_name'];
	}
	
	// <editor-fold desc="Match handlers">
	function match_get() {
		$this->load->model('match', 'model');
		$this->load->helper('addprop');
		
		$get_results = $this->get('results') !== false;
		
		if ($this->get('all') !== false) {
			$result = $this->model->get_all($get_results);
			$this->_resp_ok($result);
		}
		else if ($this->get('current') !== false) {
			$result = $this->model->get_current($get_results);
			$this->_resp_ok($result);
		}
		else {
			$params = getprops($this, array(
				 'matchId' => 'id',
				 'roundNum' => 'round',
				 'matchNum' => 'match',
				 'open' => 'open',
				 'status' => 'status',
			));
			
			if ($params === array())
				$this->_resp_bad_request();
			else {
				$result = $this->model->get_where($params, $get_results);
				$this->_resp_ok($result);
			}
		}
	}
	
	function match_post() {
		$this->load->model('match', 'model');
		$this->load->helper('addprop');
		
		$method = $this->post('method');
		$params = postprops($this, array(
			'open' => 'open',
			'status' => 'status',
			'roundNum' => 'round',
			'matchNum' => 'match',
			'teams' => 'teams',
		));
		
		switch ($method) {
			case 'create':
				if (!props_defined($params, array('roundNum', 'matchNum', 'teams'))) {
					$this->_resp_bad_request('round, match and teams Required');
				}
				else {
					$id = $this->model->create($params);
					$this->_resp_created(array( 'matchId' => $id ));
				}
				break;
			
			case 'update':
				$id = $this->post('id');
				
				if ($id === false) {
					$this->_resp_bad_request('id Required');
				}
				else {
					$this->model->update($id, $params);
					$this->_resp_ok($this->model->get_by_id($id));
				}
				break;
			
			case 'delete':
				$id = $this->post('id');
				if ($id === false) {
					$this->_resp_bad_request('id Required');
				}
				else {
					$this->model->delete($id);
					$this->_resp_deleted();
				}
				break;
			
			default:
				$this->_resp_bad_request('Unknown Method');
		}
	}
	// </editor-fold>
	
	
	// <editor-fold desc="Match result handlers">
	function matchresult_get() {
		$this->load->model('match', 'model');
		$this->load->helper('addprop');
		
		if ($this->get('all') !== false) {
			$result = $this->model->get_all_results();
			$this->_resp_ok($result);
		}
		else if ($this->get('current')!== false) {
			$team = $this->get('team');
			$result = $this->model->get_results_by_current_match($team ? $team : 0);
			$this->_resp_ok($result);
		}
		else if ($this->get('match')) {
			$team = $this->get('team');
			$result = $this->model->get_results_by_match($this->get('match'), $team ? $team : 0);
			$this->_resp_ok($result);
		}
		else if ($this->get('team')) {
			$result = $this->model->get_results_by_team($this->get('team'));
			$this->_resp_ok($result);
		}
		else {
			$this->_resp_bad_request();
		}
	}
	
	function matchresult_post() {
		$this->load->model('score', 'score');
		$this->load->model('match', 'match');
		$this->load->helper('addprop');
		
		$method = $this->post('method');
		switch ($method) {
			case 'update':
				$matchId = $this->post('match');
				$teamId = $this->post('team');
				if (!$teamId)
					$teamId = 0;
				if (!$matchId) 
					$this->_resp_bad_request();
				else {
					$this->score->update_results($matchId, $teamId);
					$response = $this->match->get_results_by_match($matchId, $teamId);
					$this->_resp_ok($response);
				}
				break;
				
			case 'reset':
				$matchId = $this->post('match');
				$update = $this->post('update') !== false;
				
				if (!$matchId) 
					$this->_resp_bad_request();
				else {
					$this->match->reset_results($matchId);
					if ($update) 
						$this->score->update_results($matchId);
					
					$response = $this->match->get_results_by_match($matchId);
					$this->_resp_ok($response);
				}
				
			default:
				$this->_resp_bad_request($this->post('action'));
		}
		
	}
	// </editor-fold>
	
	// <editor-fold desc="Scoring handlers">
	function score_get() {
		$this->load->model('score', 'model');
		$this->load->helper('addprop');
		
		if ($this->get('all') !== false) {
			$result = $this->model->get_all();
			$this->_resp_ok($result);
		}
		else if ($this->get('current')!== false) {
			$result = $this->model->get_by_current_match();
			$this->_resp_ok($result);
		} 
		else {
			$params = getprops($this, array(
				 'matchId' => 'match',
				 'fromTeamId' => 'from',
				 'onTeamId' => 'on',
				 'actionId' => 'action',
				 'foulId' => 'foul',
				 'apiId' => 'api',
			));
			
			if ($this->get('scorer')) {
				$this->load->model('user', 'user');
				$apikey = $this->user->get_api_key_by_user($this->get('scorer'));
				addprop($params, 'apiId', $apikey ? $apikey->id : 0);
			}
			
			if ($params === array())
				$this->_resp_bad_request();
			else {
				$result = $this->model->get_where($params);
				$this->_resp_ok($result);
			}
		}
	}
	
	
	function score_post() {
		$this->load->model('score', 'score');
		$this->load->helper('addprop');
		
		$method = $this->post('method');
		$params = postprops($this, array(
			'matchId' => 'match',
			'fromTeamId' => 'from',
			'onTeamId' => 'on',
			'actionId' => 'action',
			'foulId' => 'foul',
			'disabled' => 'disabled',
			'disqualified' => 'disqualified',
		));
		
		switch ($method) {
			case 'create':
				$apikey = $this->post('apikey');
				//TODO Get apiId from api key and validate
				
				$params['apiId'] = 0;
				
				if (!props_defined($params, array('matchId', 'fromTeamId', 'onTeamId'))) {
					$this->_resp_bad_request('match, from and on Required');
				}
				else {
					// check whether scoring is open for the match
					$id = $this->score->create($params);
					if ($id !== false)
						$this->_resp_created(array( 'id' => $id ));
					else
						$this->_resp_scoring_closed();
				}
				break;
			
			case 'update':
				$id = $this->post('id');
				$params = postprops($this, array(
					 'dateTime' => 'datetime'
				), $params);
				
				if ($id === false) {
					$this->_resp_bad_request('id Required');
				}
				else {
					$success = $this->score->update($id, $params);
					if ($success)
						$this->_resp_ok($this->score->get_by_id($id));
					else
						$this->_resp_scoring_closed();
				}
				break;
			
			case 'delete':
				$id = $this->post('id');
				if ($id === false) {
					$this->_resp_bad_request('id Required');
				}
				else {
					$success = $this->score->delete($id);
					if ($success)
						$this->_resp_deleted();
					else
						$this->_resp_scoring_closed();
				}
				break;
				
			case 'reset':
				if (!props_defined($params, array('matchId'))) {
					$this->_resp_bad_request('match Required');
				}
				else {
					$success = $this->score->deleteAll($params['matchId']);
					if ($success)
						$this->_resp_deleted();
					else
						$this->_resp_scoring_closed();
				}
			
			default:
				$this->_resp_bad_request('Uknown Method');
		}
	}
	
	//</editor-fold>
	
	
	
	
	function permissions_get() {
		$this->load->model('user', 'model');
		if ($this->get('all') !== false) {
			$result = $this->model->get_all_permissions();
			$this->_resp_ok($result);
		}
		else if ($this->get('id')) {
			$result = $this->model->get_permissions($this->get('id'));
			$result = $result ? array($result) : array();
			$this->_resp_ok($result);
		}
		else {
			$this->_resp_bad_request();
		}
	}
	
	function color_get() {
		$this->load->model('rules', 'model');

		if ($this->get('all') !== false) {
			$result = $this->model->get_colors();
			$this->_resp_ok($result);
		}
		else if ($this->get('id')) {
			$result = $this->model->get_color_by_id($this->get('id'));
			$this->_resp_ok($result);
		}
		else {
			$this->_resp_bad_request();
		}
	}
	
	function color_post() {
		$this->load->model('rules', 'model');
		$this->load->helper('addprop');
		
		$method = $this->post('method');
		$params = postprops($this, array(
			'colorId' => 'newid',
			'name' => 'name',
		));
		
		switch ($method) {
			case 'create':
				if (!props_defined($params, array('name'))) {
					$this->_resp_bad_request('name Required');
				}
				else {
					$id = $this->model->create_color($params);
					$this->_resp_created(array( 'colorId' => $id ));
				}
				break;
			
			case 'update':
				$id = $this->post('id');
				
				if ($id === false) {
					$this->_resp_bad_request('id Required');
				}
				else {
					$this->model->update_color($id, $params);
					$this->_resp_ok($this->model->get_color_by_id($id));
				}
				break;
			
			case 'delete':
				$id = $this->post('id');
				if ($id === false) {
					$this->_resp_bad_request('id Required');
				}
				else {
					$this->model->delete_color($id);
					$this->_resp_deleted();
				}
				break;
			
			default:
				$this->_resp_bad_request('Unknown Method');
		}
	}
	
	function action_get() {
		$this->load->model('rules', 'model');

		if ($this->get('all') !== false) {
			$result = $this->model->get_actions();
			$this->_resp_ok($result);
		}
		else if ($this->get('id')) {
			$result = $this->model->get_action_by_id($this->get('id'));
			$this->_resp_ok($result);
		}
		else {
			$this->_resp_bad_request();
		}
	}
	
	function action_post() {
		$this->load->model('rules', 'model');
		$this->load->helper('addprop');
		
		$method = $this->post('method');
		$params = postprops($this, array(
			'actionId' => 'newid',
			'fromValue' => 'fromvalue',
			'onValue' => 'onvalue',
			'name' => 'name',
		));
		
		switch ($method) {
			case 'create':
				if (!props_defined($params, array('name', 'fromValue', 'onValue'))) {
					$this->_resp_bad_request('name, fromvalue and onvalue Required');
				}
				else {
					$id = $this->model->create_action($params);
					$this->_resp_created(array( 'actionId' => $id ));
				}
				break;
			
			case 'update':
				$id = $this->post('id');
				
				if ($id === false) {
					$this->_resp_bad_request('id Required');
				}
				else {
					$this->model->update_action($id, $params);
					$this->_resp_ok($this->model->get_action_by_id($id));
				}
				break;
			
			case 'delete':
				$id = $this->post('id');
				if ($id === false) {
					$this->_resp_bad_request('id Required');
				}
				else {
					$this->model->delete_action($id);
					$this->_resp_deleted();
				}
				break;
			
			default:
				$this->_resp_bad_request('Unknown Method');
		}
	}

	function foul_get() {
		$this->load->model('rules', 'model');

		if ($this->get('all') !== false) {
			$result = $this->model->get_fouls();
			$this->_resp_ok($result);
		}
		else if ($this->get('id')) {
			$result = $this->model->get_foul_by_id($this->get('id'));
			$this->_resp_ok($result);
		}
		else {
			$this->_resp_bad_request();
		}
	}
	
	function foul_post() {
		$this->load->model('rules', 'model');
		$this->load->helper('addprop');
		
		$method = $this->post('method');
		$params = postprops($this, array(
			'foulId' => 'newid',
			'value' => 'value',
			'name' => 'name',
		));
		
		switch ($method) {
			case 'create':
				if (!props_defined($params, array('name', 'value'))) {
					$this->_resp_bad_request('name and value Required');
				}
				else {
					$id = $this->model->create_foul($params);
					$this->_resp_created(array( 'foulId' => $id));
				}
				break;
			
			case 'update':
				$id = $this->post('id');
				
				if ($id === false) {
					$this->_resp_bad_request('id Required');
				}
				else {
					$this->model->update_foul($id, $params);
					$this->_resp_ok($this->model->get_foul_by_id($id));
				}
				break;
			
			case 'delete':
				$id = $this->post('id');
				if ($id === false) {
					$this->_resp_bad_request('id Required');
				}
				else {
					$this->model->delete_foul($id);
					$this->_resp_deleted();
				}
				break;
			
			default:
				$this->_resp_bad_request('Unknown Method');
		}
	}
	
	
	
	function event_post() {
		$this->load->model('score', 'model');
		
		$event = $this->input->post('event');
		$data = array();
		foreach ( $_POST as $key => $value ) {
			if ($key != 'event')
				$data[$key] = $this->input->post($key);
		}
		
		if (event === false)
			$this->_resp_bad_request('Event Undefined');
		else {
			$this->model->post_to_clock($event, $data);
			$this->_resp_ok();
		}
	}
	
}