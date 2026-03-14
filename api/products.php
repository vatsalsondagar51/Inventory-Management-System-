<?php
/**
 * Products API (requires session).
 * GET: list, GET ?id=: list one, POST: create, PUT: update, DELETE: delete
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

function sendProducts($pdo) {
    $stmt = $pdo->query('SELECT id, name, sku, category, quantity, unit, low_stock_threshold AS lowStockThreshold, created_at AS createdAt FROM products ORDER BY id');
    $rows = $stmt->fetchAll();
    foreach ($rows as &$r) {
        $r['id'] = (int) $r['id'];
        $r['quantity'] = (int) $r['quantity'];
        $r['lowStockThreshold'] = (int) $r['lowStockThreshold'];
    }
    echo json_encode($rows);
}

if ($method === 'GET') {
    if ($id) {
        $stmt = $pdo->prepare('SELECT id, name, sku, category, quantity, unit, low_stock_threshold AS lowStockThreshold, created_at AS createdAt FROM products WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) {
            http_response_code(404);
            echo json_encode(['error' => 'Product not found']);
            exit;
        }
        $row['id'] = (int) $row['id'];
        $row['quantity'] = (int) $row['quantity'];
        $row['lowStockThreshold'] = (int) $row['lowStockThreshold'];
        echo json_encode($row);
    } else {
        sendProducts($pdo);
    }
    exit;
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $name = $input['name'] ?? '';
    $sku = $input['sku'] ?? '';
    $category = $input['category'] ?? '';
    $quantity = (int) ($input['quantity'] ?? 0);
    $unit = $input['unit'] ?? 'pcs';
    $lowStockThreshold = (int) ($input['lowStockThreshold'] ?? 5);

    $stmt = $pdo->prepare('INSERT INTO products (name, sku, category, quantity, unit, low_stock_threshold) VALUES (?, ?, ?, ?, ?, ?)');
    $stmt->execute([$name, $sku, $category, $quantity, $unit, $lowStockThreshold]);
    $newId = (int) $pdo->lastInsertId();

    $stmt = $pdo->prepare('INSERT INTO activity (message) VALUES (?)');
    $stmt->execute(["Product added: $name"]);

    echo json_encode([
        'id' => $newId,
        'name' => $name,
        'sku' => $sku,
        'category' => $category,
        'quantity' => $quantity,
        'unit' => $unit,
        'lowStockThreshold' => $lowStockThreshold,
        'createdAt' => date('c'),
    ]);
    exit;
}

if ($method === 'PUT' && $id) {
    $input = json_decode(file_get_contents('php://input'), true) ?: [];
    $stmt = $pdo->prepare('SELECT id, name FROM products WHERE id = ?');
    $stmt->execute([$id]);
    $existing = $stmt->fetch();
    if (!$existing) {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
        exit;
    }
    $name = $input['name'] ?? $existing['name'];
    $sku = $input['sku'] ?? '';
    $category = $input['category'] ?? '';
    $quantity = isset($input['quantity']) ? (int) $input['quantity'] : null;
    $unit = $input['unit'] ?? 'pcs';
    $lowStockThreshold = isset($input['lowStockThreshold']) ? (int) $input['lowStockThreshold'] : null;

    $stmt = $pdo->prepare('UPDATE products SET name=?, sku=?, category=?, unit=?, quantity=COALESCE(?, quantity), low_stock_threshold=COALESCE(?, low_stock_threshold) WHERE id=?');
    $stmt->execute([$name, $sku, $category, $unit, $quantity, $lowStockThreshold, $id]);

    $stmt = $pdo->prepare('INSERT INTO activity (message) VALUES (?)');
    $stmt->execute(["Product updated: $name"]);

    $stmt = $pdo->prepare('SELECT id, name, sku, category, quantity, unit, low_stock_threshold AS lowStockThreshold, created_at AS createdAt FROM products WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    $row['id'] = (int) $row['id'];
    $row['quantity'] = (int) $row['quantity'];
    $row['lowStockThreshold'] = (int) $row['lowStockThreshold'];
    echo json_encode($row);
    exit;
}

if ($method === 'DELETE' && $id) {
    $stmt = $pdo->prepare('DELETE FROM products WHERE id = ?');
    $stmt->execute([$id]);
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Product not found']);
        exit;
    }
    $stmt = $pdo->prepare('INSERT INTO activity (message) VALUES (?)');
    $stmt->execute(['Product removed']);
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(400);
echo json_encode(['error' => 'Bad request']);
