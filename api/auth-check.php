<?php
/**
 * GET: Returns current user from session or 401.
 * Used by frontend to verify session when using database mode.
 */
require __DIR__ . '/init.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$user = $_SESSION['user'] ?? null;
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

echo json_encode(['user' => $user]);
