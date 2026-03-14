<?php
/**
 * Bootstrap for API: load config and database.
 * Use from api/*.php: require __DIR__ . '/init.php';
 */
session_start();

$configPath = dirname(__DIR__) . '/config/config.php';
if (!is_file($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error' => 'Config not found. Copy config/config.sample.php to config/config.php and set your database credentials.',
    ]);
    exit;
}

$config = require $configPath;
require dirname(__DIR__) . '/config/database.php';
