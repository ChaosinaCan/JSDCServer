<?php

function addprop(&$array, $name, $value) {
	if ($value !== false)
		$array[$name] = $value;
}

function getprops($input, $values, &$array = null) {
	if (!$array)
		$array = array();
	
	foreach ($values as $key => $value) {
		addprop($array, $key, $input->get($value));
	}
	return $array;
}

function postprops($input, $values, &$array = null) {
	if (!$array)
		$array = array();
	
	foreach ($values as $key => $value) {
		addprop($array, $key, $input->post($value));
	}
	return $array;
}

function props_defined($array, $props) {
	foreach ($props as $key) {
		if (!isset($array[$key]))
			return false;
	}
	return true;
}

?>
