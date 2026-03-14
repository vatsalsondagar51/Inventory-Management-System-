<?php
/**
 * POST: { "name": "...", "email": "...", "password": "..." }
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
$name = trim($input['name'] ?? '');
$email = trim($input['email'] ?? '');
$password = $input['password'] ?? '';

if (!$name) {
    echo json_encode(['error' => 'Name is required.']);
    exit;
}
if (!$email) {
    echo json_encode(['error' => 'Email is required.']);
    exit;
}
if (strlen($password) < 6) {
    echo json_encode(['error' => 'Password must be at least 6 characters.']);
    exit;
}

$email = strtolower($email);

$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
if ($stmt->fetch()) {
    echo json_encode(['error' => 'An account with this email already exists.']);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
$stmt->execute([$name, $email, $hash]);
$id = (int) $pdo->lastInsertId();

$_SESSION['user'] = [
    'id'    => $id,
    'name'  => $name,
    'email' => $email,
];

echo json_encode([
    'user' => [
        'id'    => $id,
        'name'  => $name,
        'email' => $email,
    ],
]);
