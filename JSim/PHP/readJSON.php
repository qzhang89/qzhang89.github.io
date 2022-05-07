<?php
	$dir = "JSON/";
	$files = scandir($dir);
	echo json_encode($files);
?>