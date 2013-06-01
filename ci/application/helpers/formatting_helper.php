<?php

function to_class($string) {
	return trim(preg_replace('/[^\w\d]+/', '-', strtolower($string)), '-');
}


?>
