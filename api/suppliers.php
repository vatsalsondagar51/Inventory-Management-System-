<?php
/**
 * Suppliers API (requires session).
 * GET: list, POST: create, PUT ?id=: update, DELETE ?id=: delete
 */
require __DIR__ . '/init.php';

header('Content-Type: application/json');

$user = $_SESSION['user'] ?? null;
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Not logged in']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$id = isset($_GET['id']) ? (int) $_GET['id'] : null;

function listSuppliers($pdo) {
    $stmt = $pdo->query('SELECT id, name, contact, email, address, created_at AS createdAt FROM suppliers ORDER BY id');
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) $r['id'] = (int) $r['id'];
    return $rows;
}

if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare('SELECT id, name, contact, email, address, created_at AS createdAt FROM suppliers WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'Supplier not found']);
            exit;
        }
        $row['id'] = (int) $row['id'];
        echo json_encode($row);
    } else {
        echo json_encode(listSuppliers($pdo));
    }
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $name = $input['name'] ?? '';
    $contact = $input['contact'] ?? '';
    $email = $input['email'] ?? '';
    $address = $input['address'] ?? '';

    $stmt = $pdo->prepare('INSERT INTO suppliers (name, contact, email, address) VALUES (?, ?, ?, ?)');
    $stmt->execute([$name, $contact, $email, $address]);
    $newId = (int) $pdo->lastInsertId();
    $stmt = $pdo->prepare('INSERT INTO activity (message) VALUES (?)');
    $stmt->execute(["Supplier added: $name"]);

    echo json_encode([
        'id' => $newId, 'name' => $name, 'contact' => $contact, 'email' => $email, 'address' => $address,
        'createdAt' => date('c'),
    ]);
    exit;
}

if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $stmt = $pdo->prepare('UPDATE suppliers SET name=?, contact=?, email=?, address=? WHERE id=?');
    $stmt->execute([
        $input['name'] ?? '',
        $input['contact'] ?? '',
        $input['email'] ?? '',
        $input['address'] ?? '',
        $id,
    ]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Supplier not found']);
        exit;
    }
    $stmt = $pdo->prepare('SELECT id, name, contact, email, address, created_at AS createdAt FROM suppliers WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    $row['id'] = (int) $row['id'];
    echo json_encode($row);
    exit;
}

if ($method === 'DELETE' && $id) {
    $stmt = $pdo->prepare('DELETE FROM suppliers WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Supplier not found']);
        exit;
    }
    $pdo->prepare('INSERT INTO activity (message) VALUES (?)')->execute(['Supplier removed']);
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Bad request']);
