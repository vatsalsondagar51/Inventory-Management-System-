<?php
/**
 * Copy this file to config.php and update the values for your XAMPP MySQL setup.
 * Do not commit config.php to version control (it contains credentials).
 */
return [
    'db' => [
        'host'     => 'localhost',
        'port'     => 3306,
        'name'     => 'inventory_db',
        'username' => 'root',
        'password' => '',   // XAMPP default is empty; set if you added a MySQL root password
        'charset'  => 'utf8mb4',
    ],
];
