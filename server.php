<?php

// required password to write database
// leave empty to do not require password at all (not recommended)
// TODO change following option
define("PASSWORD", "Change This");

// require password for reading database
define("REQUIRE_PASSWORD_READING", true);

// Path to kdbx databases
define("BASE_PATH", __DIR__ . "/databases");

function require_authorization() {
    $valid_password = PASSWORD;
    if (empty($valid_password))
        return;

    $password = $_GET["password"];

    if (empty($password) || $password !== $valid_password) {
        header('HTTP/1.0 401 Unauthorized');
        die ("Not authorized");
    }
}

function clean_filename($file) {
    $file = basename($file);
    $file = preg_replace("/[^\w\s\d\-_~,;\[\]\(\)\.]/", '', $file);
    return $file;
}

function validate_file($path) {
    if (!file_exists($path) || is_dir($path)) {
        header('HTTP/1.0 404 Not Found');
        die("Not Found");
    }
}

if (isset($_GET["path"])) {
    if (REQUIRE_PASSWORD_READING)
        require_authorization();

    $files = glob(BASE_PATH . "/*.kdbx");
    $list = [];
    foreach($files as $file) {
        $list[] = [
            "name" => basename($file),
            "path" => basename($file),
            "rev" => filemtime($file),
            "dir" => false
        ];
    }
    header("Content-Type: text/json");
    print json_encode($list);
    return;
}

if (isset($_GET["file"])) {
    if (REQUIRE_PASSWORD_READING)
        require_authorization();

    $file = BASE_PATH . "/" . clean_filename($_GET["file"]);
    validate_file($file);

    header("Content-Type: application/binary");
    clearstatcache();
    header('Last-Modified: '.gmdate('D, d M Y H:i:s', filemtime($file)).' GMT', true, 200);
    echo file_get_contents($file);
    return;
}

if (isset($_GET["stat"])) {
    if (REQUIRE_PASSWORD_READING)
        require_authorization();

    $file = BASE_PATH . "/" . clean_filename($_GET["stat"]);
    validate_file($file);

    clearstatcache();
    header('Last-Modified: '.gmdate('D, d M Y H:i:s', filemtime($file)).' GMT', true, 200);
    echo "";
    return;
}

if (isset($_GET["save"])) {
    require_authorization();

    $file = BASE_PATH . "/" . clean_filename($_GET["save"]);
    validate_file($file);

    $rev = $_GET["rev"];

    clearstatcache();
    $current_rev = gmdate('D, d M Y H:i:s', filemtime($file)).' GMT';

    if ($current_rev !== $rev) {
        header('HTTP/1.0 500 Revision mismatch');
        return;
    }

    $contents = file_get_contents("php://input");
    if (strlen($contents) > 0)
        file_put_contents($file, $contents);

    clearstatcache();
    header('Last-Modified: '.gmdate('D, d M Y H:i:s', filemtime($file)).' GMT', true, 200);
    echo "";
    return;
}



