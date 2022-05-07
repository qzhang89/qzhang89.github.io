<?php
	$file = fopen($_POST["filename"], "w");
	$status = fwrite($file, $_POST["data"]);
	fclose($file);
	if($status)
		echo "0";
	else
		echo "-1";
?>