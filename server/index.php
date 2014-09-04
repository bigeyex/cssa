<?php
// if json_encode not installed - simulate it.
if (!function_exists('json_encode')) {
	require_once 'jsonwrapper_inner.php';
} 

define('APP_DEBUG', true);

require './ThinkPHP/ThinkPHP.php';