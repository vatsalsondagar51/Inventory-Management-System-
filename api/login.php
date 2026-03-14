<?php
/**
 * POST: { "email": "...", "password": "..." }
 * Returns: { "user": { "id", "name", "email" } } or { "error": "..." }
 */
require __DIR__ . '/init.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (!$email || $password === '') {
    echo json_encode(['error' => 'Email and password are required.']);
    exit;
}

$stmt = $pdo->prepare('SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    echo json_encode(['error' => 'Invalid email or password.']);
    exit;
}

$_SESSION['user'] = [
    'id'    => (int) $user['id'],
    'name'  => $user['name'],
    'email' => $user['email'],
];

echo json_encode([
    'user' => [
        'id'    => (int) $user['id'],
        'name'  => $user['name'],
        'email' => $user['email'],
    ],
]);
