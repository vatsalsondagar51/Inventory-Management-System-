<?php
/**
 * Activity log API (requires session).
 * GET: list (last 50)
 */
require __DIR__ . '/init.php';

header('Content-Type: application/json');

$user = $_SESSION['user'] ?? null;
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$stmt = $pdo->query('SELECT id, message, created_at AS time FROM activity ORDER BY id DESC LIMIT 50');
$rows = $stmt->fetchAll();
foreach ($rows as &$r) $r['id'] = (int) $r['id'];
echo json_encode($rows);
