<?php
/**
 * Deliveries API (requires session).
 * GET: list, POST: create, PUT ?id=: update
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

function listDeliveries($pdo) {
    $stmt = $pdo->query('SELECT id, order_id AS orderId, tracking, carrier, status, estimated_date AS estimatedDate, address, created_at AS createdAt FROM deliveries ORDER BY id DESC');
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['id'] = (int) $r['id'];
        $r['orderId'] = (int) $r['orderId'];
    }
    return $rows;
}

if ($method === 'GET') {
    echo json_encode(listDeliveries($pdo));
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $orderId = (int) ($input['orderId'] ?? 0);
    $tracking = $input['tracking'] ?? '';
    $carrier = $input['carrier'] ?? '';
    $estimatedDate = !empty($input['estimatedDate']) ? $input['estimatedDate'] : null;
    $address = $input['address'] ?? '';

    $stmt = $pdo->prepare('INSERT INTO deliveries (order_id, tracking, carrier, estimated_date, address) VALUES (?, ?, ?, ?, ?)');
    $stmt->execute([$orderId, $tracking, $carrier, $estimatedDate, $address]);
    $newId = (int) $pdo->lastInsertId();
    $pdo->prepare('INSERT INTO activity (message) VALUES (?)')->execute(["Delivery created for order #$orderId"]);

    echo json_encode([
        'id' => $newId, 'orderId' => $orderId, 'tracking' => $tracking, 'carrier' => $carrier,
        'status' => 'pending', 'estimatedDate' => $estimatedDate, 'address' => $address,
        'createdAt' => date('c'),
    ]);
    exit;
}

if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $fields = [];
    $params = [];
    if (array_key_exists('status', $input)) { $fields[] = 'status = ?'; $params[] = $input['status']; }
    if (array_key_exists('tracking', $input)) { $fields[] = 'tracking = ?'; $params[] = $input['tracking']; }
    if (array_key_exists('carrier', $input)) { $fields[] = 'carrier = ?'; $params[] = $input['carrier']; }
    if (array_key_exists('estimatedDate', $input)) { $fields[] = 'estimated_date = ?'; $params[] = $input['estimatedDate'] ?: null; }
    if (array_key_exists('address', $input)) { $fields[] = 'address = ?'; $params[] = $input['address']; }
    if (empty($fields)) {
        echo json_encode(['error' => 'No fields to update']);
        exit;
    }
    $params[] = $id;
    $pdo->prepare('UPDATE deliveries SET ' . implode(', ', $fields) . ' WHERE id = ?')->execute($params);
    $stmt = $pdo->prepare('SELECT id, order_id AS orderId, tracking, carrier, status, estimated_date AS estimatedDate, address, created_at AS createdAt FROM deliveries WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) {
        http_response_code(404);
        echo json_encode(['error' => 'Delivery not found']);
        exit;
    }
    $row['id'] = (int) $row['id'];
    $row['orderId'] = (int) $row['orderId'];
    $pdo->prepare('INSERT INTO activity (message) VALUES (?)')->execute(["Delivery #{$id} status: {$row['status']}"]);
    echo json_encode($row);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Bad request']);
