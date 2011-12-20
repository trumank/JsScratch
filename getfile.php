<?php
$file = $_GET['f'];
if (substr($file, 0, 7) == 'http://')
{
	$headers = get_headers($file) or header("HTTP/1.0 404 Not Found");
	if (!$headers) exit;
	if ($headers[0] == "HTTP/1.0 404 Not Found") exit;
	foreach ($headers as $value)
		header($value);
	echo file_get_contents($file);
	exit;
}
if (file_exists($file))
{
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="'.basename($file).'"');
    header('Content-Transfer-Encoding: binary');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0');
    header('Pragma: public');
    header('Content-Length: ' . filesize($file));
    ob_clean();
    flush();
    readfile($file);
    exit;
}
header("HTTP/1.0 404 Not Found");
?>