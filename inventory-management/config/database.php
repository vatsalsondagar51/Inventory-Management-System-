<?php
/**
 * Database connection using PDO (MySQL).
 * Include this after loading config.php.
 */

if (!isset($config) || !is_array($config['db'] ?? null)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Database config missing. Copy config/config.sample.php to config/config.php.']);
    exit;
}

$db = $config['db'];
$dsn = sprintf(
    'mysql:host=%s;port=%s;dbname=%s;charset=%s',
    $db['host'],
    $db['port'] ?? 3306,
    $db['name'],
    $db['charset'] ?? 'utf8mb4'
);

try {
    $pdo = new PDO($dsn, $db['username'], $db['password'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'error'   => 'Database connection failed',
        'message' => $e->getMessage(),
    ]);
    exit;
}
