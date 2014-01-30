<?php defined('BASEPATH') OR exit('No direct script access allowed');

/**
 * JDSC REST API
 */

class Admin extends CI_Controller {

	public function __construct() {
		parent::__construct();

		$this->load->database();
		$this->load->helper('html');
		$this->load->helper('url');
		$this->load->helper('arrays');
		$this->load->config('jsdc');
	}

	private function _show_info($heading, $message) {
		$this->load->view('admin/info', array('message' => $message, 'heading' => $heading));
	}

	private function _display($page, $data = null) {
		$scripts = array();
		$styles = array();

		if (is_null($data))
			$data = array();

		// Get dependencies
		if (isset($this->pages[$page]['require'])) {
			foreach ($this->pages[$page]['require'] as $name) {
				$info = $this->dependencies[$name];
				if (isset($info['js'])) {
					foreach ($info['js'] as $script) {
						array_push($scripts, $script);
					}
				}

				if (isset($info['css'])) {
					foreach ($info['css'] as $style) {
						array_push($styles, $style);
					}
				}
			}
		}

		$header = array(
			'clock_address' => $this->config->item('jsdc_clock_address'),
			'page' => $page,
			'pages' => $this->pages,
			'scripts' => $scripts,
			'styles' => $styles,
		);


		$this->load->view('admin/header', $header);
		$this->load->view('admin/' . $page, $data);
		$this->load->view('admin/footer');
	}

	public function index() {
		$this->load->view('admin/index');
	}

	public function game() {
		$this->load->model('match', 'matches');
		$this->load->model('rules', 'rules');

		$data = array(
			'colors' => $this->rules->get_colors(),
			'actions' => $this->rules->get_actions(),
			'fouls' => $this->rules->get_fouls(),
			'match' => $this->matches->get_current(),
			'max_rounds' => $this->config->item('max_rounds'),
			'max_matches' => $this->config->item('max_matches'),
			'max_teams' => $this->config->item('teams_per_match'),
		);

		$this->_display('game', $data);
	}

	public function matches() {
		$this->load->model('match', 'matches');
		$this->load->model('team', 'teams');
		$this->load->model('rules', 'rules');

		$data = array(
			'colors' => $this->rules->get_colors(),
			'matches' => $this->matches->get_all(),
			'teams' => $this->teams->get_all(),
			'max_rounds' => $this->config->item('max_rounds'),
			'max_matches' => $this->config->item('max_matches'),
			'max_teams' => $this->config->item('teams_per_match'),
		);

		$this->_display('matches', $data);
	}

	public function scores() {
		$this->load->model('rules', 'rules');

		$data = array(
			'colors' => $this->rules->get_colors(),
			'actions' => $this->rules->get_actions(),
			'fouls' => $this->rules->get_fouls(),
			'max_rounds' => $this->config->item('max_rounds'),
			'max_matches' => $this->config->item('max_matches'),
			'max_teams' => $this->config->item('teams_per_match'),
		);

		$this->_display('scores', $data);
	}

	public function teams() {
		$this->load->model('team', 'teams');

		$data = array(
			'teams' => $this->teams->get_all(),
		);

		$this->_display('teams', $data);
	}

	public function users() {
		$data = array();
		$this->_display('users', $data);
	}

	public function rules() {
		$data = array();
		$this->_display('rules', $data);
	}

	public function results() {
		$this->load->model('team', 'teams');

		$data = array(
			'teams' => $this->teams->get_all(),
		);

		$this->_display('results', $data);
	}

	public function scoreboard() {
		$this->load->model('rules', 'rules');

		$data = array(
			'colors' => $this->rules->get_colors(),
			'actions' => $this->rules->get_actions(),
			'fouls' => $this->rules->get_fouls(),
			'max_teams' => $this->config->item('teams_per_match'),
			'max_rounds' => $this->config->item('max_rounds'),
		);

		$this->_display('scoreboard', $data);
	}

	public function schedule() {
		$this->load->model('rules', 'rules');

		$data = array(
			'colors' => $this->rules->get_colors(),
			'max_teams' => $this->config->item('teams_per_match'),
		);

		$this->_display('schedule', $data);
	}

	public function audio() {
		$this->_display('audio');
	}

	public function setup() {

	}


	public function debug() {
		$this->_display('debug');
	}

	public function about() {
		$this->_display('about');
	}


	private $pages = array(
		'game' => array(
			'view' => 'columns',
			'require' => array('socket.io', 'score-listener'),
		),
		'matches' => array(
			'view' => 'full',
			'require' => array( 'tournament'),
		),
		'scores' => array(
			'view' => 'columns',
			'require' => array('socket.io', 'score-listener'),
		),
		'teams' => array(
			'view' => 'full',
		),
		'users' => array(
			'view' => 'full',
		),
		'rules' => array(
			'view' => 'full',
		),
		'results' => array(
			'view' => 'columns',
		),
		'scoreboard' => array(
			'view' => 'full',
			'theme' => 'display',
			'require' => array('socket.io', 'score-listener', 'field-listener'),
		),
		'schedule' => array(
			'view' => 'full',
			'theme' => 'display',
			'require' => array('socket.io'),
		),
		'audio' => array(
			'view' => 'full',
			'theme' => 'display',
			'require' => array('socket.io', 'audio'),
		),
		'debug' => array(
			'view' => 'columns',
		),
		'about' => array(
			'view' => 'full',
		),
	);

	private $dependencies = array(
		'socket.io' => array(
			'js' => array('clock:socket.io/socket.io.js')
		),
		'audio' => array(
			'js' => array('mediaelement/mediaelement-and-player.js'),
			'css' => array('mediaelement/mediaelementplayer.css'),
		),
		'score-listener' => array(
			'js' => array('admin/score-listener.js'),
			'css' => array('admin/score-list.css'),
		),
		'field-listener' => array(
			'js' => array('admin/field-listener.js'),
			'css' => array('common/field-display.css'),
		),
		'tournament' => array(
			'js' => array('admin/tournament.js'),
		),
	);

}