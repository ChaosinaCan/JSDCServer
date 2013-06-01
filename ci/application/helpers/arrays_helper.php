<?php

function index_by_prop($array, $propname) {
	$new = array();
	foreach ($array as $item) {
		$new[$item->$propname] = $item;
	}
	
	return $new;
}

?>
