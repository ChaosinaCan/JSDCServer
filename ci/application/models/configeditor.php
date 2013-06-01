<?php

	class ConfigEditor extends CI_Model {
		
		public function __construct() {
			parent::__construct();
		}
		
		function set_db($item, $value) {
			$this->set('database.php', 'db', $item, $value);
		}
		
		function set($config, $var, $item, $value) {
			$filename = APPPATH . 'config/' . $config;
			$file = file_get_contents($filename);
			
			$format = function($object) use(&$format) {
				if (is_array($object)) {
					$parts = array_map($format, $object);
					return 'array(' . join(', ', $parts) . ')';
				} else if (is_numeric($object)) {
					return (string)$object;
				} else if (is_bool($object)) {
					return $object ? 'TRUE' : 'FALSE';
				} else if (is_string($object)) {
					return "'" . str_replace("'", "\\'", $object) . "'";
				} else {
					return (string)$object;
				}
			};
			
			$parts = explode('.', $item);
			$keys = "['" . join("']['", $parts) . "']";
			$new_value = '$' . $var . $keys . ' = ' . $format($value) . ';';
			
			$esc_keys = str_replace(']', '\\]', str_replace('[', '\\[', $keys));
			$file = preg_replace('/\$' . $var . '\s*' . $esc_keys . '.*$/mi', $new_value, $file);
			
			file_put_contents($filename, $file);
		}
		
		
		
	}

?>
