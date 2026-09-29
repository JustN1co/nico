<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Inicjalizacja bazy SQLite w tym samym katalogu
$dbPath = __DIR__ . '/cars.db';
$db = new PDO('sqlite:' . $dbPath);
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Tworzenie tabeli na kolekcje, jeśli nie istnieje
$db->exec("CREATE TABLE IF NOT EXISTS collections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    cars_data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)");

$action = $_GET['action'] ?? '';

try {
    if ($action === 'list') {
        // Zwraca listę wszystkich tabel (bez ujawniania hasha hasła)
        $stmt = $db->query("SELECT id, title, author, created_at, updated_at, 
                            length(cars_data) - length(replace(cars_data, '\"id\":', '')) as raw_count,
                            cars_data
                            FROM collections ORDER BY updated_at DESC");
        $results = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $cars = json_decode($row['cars_data'], true) ?: [];
            $results[] = [
                'id' => $row['id'],
                'title' => $row['title'],
                'author' => $row['author'],
                'car_count' => count($cars),
                'updated_at' => $row['updated_at']
            ];
        }
        echo json_encode(['status' => 'success', 'data' => $results]);
        exit;
    }

    if ($action === 'get') {
        $id = $_GET['id'] ?? '';
        $stmt = $db->prepare("SELECT id, title, author, cars_data, updated_at FROM collections WHERE id = ?");
        $stmt->execute([$id]);
        $collection = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($collection) {
            $collection['cars'] = json_decode($collection['cars_data'], true) ?: [];
            unset($collection['cars_data']);
            echo json_encode(['status' => 'success', 'data' => $collection]);
        } else {
            http_response_code(404);
            echo json_encode(['status' => 'error', 'message' => 'Nie znaleziono tabeli']);
        }
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true);

    if ($action === 'create' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $title = trim($input['title'] ?? '');
        $author = trim($input['author'] ?? 'Anonim');
        $password = $input['password'] ?? '';
        $cars = $input['cars'] ?? [];

        if (empty($title) || empty($password)) {
            http_response_code(400);
            echo json_encode(['status' => 'error', 'message' => 'Tytuł i hasło są wymagane']);
            exit;
        }

        $id = bin2hex(random_bytes(6));
        $hash = password_hash($password, PASSWORD_DEFAULT);
        $carsJson = json_encode($cars, JSON_UNESCAPED_UNICODE);

        $stmt = $db->prepare("INSERT INTO collections (id, title, author, password_hash, cars_data) VALUES (?, ?, ?, ?, ?)");
        $stmt->execute([$id, $title, $author, $hash, $carsJson]);

        echo json_encode(['status' => 'success', 'id' => $id, 'message' => 'Utworzono kolekcję!']);
        exit;
    }

    if ($action === 'update' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $id = $input['id'] ?? '';
        $password = $input['password'] ?? '';
        $cars = $input['cars'] ?? [];
        $title = $input['title'] ?? null;

        $stmt = $db->prepare("SELECT password_hash FROM collections WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row || !password_verify($password, $row['password_hash'])) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'Błędne hasło autoryzacji!']);
            exit;
        }

        $carsJson = json_encode($cars, JSON_UNESCAPED_UNICODE);
        if ($title) {
            $stmt = $db->prepare("UPDATE collections SET cars_data = ?, title = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$carsJson, $title, $id]);
        } else {
            $stmt = $db->prepare("UPDATE collections SET cars_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?");
            $stmt->execute([$carsJson, $id]);
        }

        echo json_encode(['status' => 'success', 'message' => 'Zmiany zostały pomyślnie zapisane']);
        exit;
    }

    if ($action === 'delete' && $_SERVER['REQUEST_METHOD'] === 'POST') {
        $id = $input['id'] ?? '';
        $password = $input['password'] ?? '';

        $stmt = $db->prepare("SELECT password_hash FROM collections WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row || !password_verify($password, $row['password_hash'])) {
            http_response_code(403);
            echo json_encode(['status' => 'error', 'message' => 'Błędne hasło autoryzacji!']);
            exit;
        }

        $stmt = $db->prepare("DELETE FROM collections WHERE id = ?");
        $stmt->execute([$id]);

        echo json_encode(['status' => 'success', 'message' => 'Kolekcja usunięta']);
        exit;
    }

    echo json_encode(['status' => 'idle', 'message' => 'iCar Garage API działa poprawnie']);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}