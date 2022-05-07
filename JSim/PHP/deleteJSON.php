<?php
	$file = $_POST["filename"];
	$status = unlink($file);
	if($status)
		echo "0";
	else
		echo "-1";
?>