<?php

$file_name = 'The_Offshore_Economist.pdf';
$file_url = './' . $file_name;

if( isset( $_SERVER['HTTP_USER_AGENT'] ) ){
    $agent = $_SERVER['HTTP_USER_AGENT'];
}

/*
if( strlen(strstr($agent, 'Firefox') ) > 0 ){
	header('Content-Type: application/octet-stream');
	header("Content-Transfer-Encoding: Binary"); 
	header("Content-disposition: attachment; filename=\"".$file_name."\""); 
	readfile($file_url);
	exit;
}*/

header( "Location: " . $file_url ) ;
exit;


?>