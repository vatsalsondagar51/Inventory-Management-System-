<?php
require __DIR__ . '/init.php';
session_destroy();
header('Content-Type: application/json');
echo json_encode(['ok' => true]);
