<?php
/**
 * Orders API (requires session).
 * GET: list (with items), POST: create, PUT: update
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

function fetchOrders($pdo) {
    $stmt = $pdo->query('SELECT id, type, party, status, notes, created_at AS createdAt FROM orders ORDER BY id DESC');
    $orders = $stmt->fetchAll();
    foreach ($orders as &$o) {
        $o['id'] = (int) $o['id'];
        $stmt2 = $pdo->prepare('SELECT product_id AS productId, quantity FROM order_items WHERE order_id = ?');
        $stmt2->execute([$o['id']]);
        $o['items'] = $stmt2->fetchAll();
        foreach ($o['items'] as &$it) {
            $it['productId'] = (int) $it['productId'];
            $it['quantity'] = (int) $it['quantity'];
        }
    }
    return $orders;
}

if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare('SELECT id, type, party, status, notes, created_at AS createdAt FROM orders WHERE id = ?');
        $stmt->execute([$id]);
        $o = $stmt->fetch();
        if (!$o) {
            http_response_code(404);
            echo json_encode(['error' => 'Order not found']);
            exit;
        }
        $o['id'] = (int) $o['id'];
        $stmt2 = $pdo->prepare('SELECT product_id AS productId, quantity FROM order_items WHERE order_id = ?');
        $stmt2->execute([$o['id']]);
        $o['items'] = $stmt2->fetchAll();
        foreach ($o['items'] as &$it) {
            $it['productId'] = (int) $it['productId'];
            $it['quantity'] = (int) $it['quantity'];
        }
        echo json_encode($o);
    } else {
        echo json_encode(fetchOrders($pdo));
    }
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $type = $input['type'] ?? 'purchase';
    $party = $input['party'] ?? '';
    $notes = $input['notes'] ?? '';
    $items = is_array($input['items'] ?? null) ? $input['items'] : [];

    $stmt = $pdo->prepare('INSERT INTO orders (type, party, notes) VALUES (?, ?, ?)');
    $stmt->execute([$type, $party, $notes]);
    $orderId = (int) $pdo->lastInsertId();

    $ins = $pdo->prepare('INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)');
    foreach ($items as $it) {
        $pid = (int) ($it['productId'] ?? 0);
        $qty = max(1, (int) ($it['quantity'] ?? 1));
        if ($pid) $ins->execute([$orderId, $pid, $qty]);
    }

    $stmt = $pdo->prepare('INSERT INTO activity (message) VALUES (?)');
    $stmt->execute(["Order #$orderId created ($party)"]);

    $stmt = $pdo->prepare('SELECT id, type, party, status, notes, created_at AS createdAt FROM orders WHERE id = ?');
    $stmt->execute([$orderId]);
    $o = $stmt->fetch();
    $o['id'] = (int) $o['id'];
    $stmt2 = $pdo->prepare('SELECT product_id AS productId, quantity FROM order_items WHERE order_id = ?');
    $stmt2->execute([$orderId]);
    $o['items'] = $stmt2->fetchAll();
    foreach ($o['items'] as &$it) {
        $it['productId'] = (int) $it['productId'];
        $it['quantity'] = (int) $it['quantity'];
    }
    echo json_encode($o);
    exit;
}

if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $stmt = $pdo->prepare('SELECT id FROM orders WHERE id = ?');
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Order not found']);
        exit;
    }
    if (isset($input['status'])) {
        $pdo->prepare('UPDATE orders SET status = ? WHERE id = ?')->execute([$input['status'], $id]);
    }
    if (isset($input['party'])) {
        $pdo->prepare('UPDATE orders SET party = ? WHERE id = ?')->execute([$input['party'], $id]);
    }
    if (isset($input['notes'])) {
        $pdo->prepare('UPDATE orders SET notes = ? WHERE id = ?')->execute([$input['notes'], $id]);
    }
    if (isset($input['items']) && is_array($input['items'])) {
        $pdo->prepare('DELETE FROM order_items WHERE order_id = ?')->execute([$id]);
        $ins = $pdo->prepare('INSERT INTO order_items (order_id, product_id, quantity) VALUES (?, ?, ?)');
        foreach ($input['items'] as $it) {
            $pid = (int) ($it['productId'] ?? 0);
            $qty = max(1, (int) ($it['quantity'] ?? 1));
            if ($pid) $ins->execute([$id, $pid, $qty]);
        }
    }
    $stmt = $pdo->prepare('INSERT INTO activity (message) VALUES (?)');
    $stmt->execute(["Order #$id updated"]);

    $stmt = $pdo->prepare('SELECT id, type, party, status, notes, created_at AS createdAt FROM orders WHERE id = ?');
    $stmt->execute([$id]);
    $o = $stmt->fetch();
    $o['id'] = (int) $o['id'];
    $stmt2 = $pdo->prepare('SELECT product_id AS productId, quantity FROM order_items WHERE order_id = ?');
    $stmt2->execute([$id]);
    $o['items'] = $stmt2->fetchAll();
    foreach ($o['items'] as &$it) {
        $it['productId'] = (int) $it['productId'];
        $it['quantity'] = (int) $it['quantity'];
    }
    echo json_encode($o);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Bad request']);
