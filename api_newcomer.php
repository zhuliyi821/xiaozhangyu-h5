<?php
/**
 * 🎯 新手成长任务 API
 *
 * 将 150,000 注册赠送游戏豆拆分为 5 步任务：
 *   ① 注册完成  → 10,000 🎮 (即时到账)
 *   ② 起一卦分享 → 20,000 🎮 (分享即完成)
 *   ③ 参与游戏分享 → 30,000 🎮 (分享即完成)
 *   ④ 发起PK分享  → 40,000 🎮 (分享即完成)
 *   ⑤ 分享产品矩阵 → 50,000 🎮 (需分享)
 *
 * Endpoints:
 *   GET  /api/newcomer/tasks?uid=X        → 获取用户任务列表
 *   POST /api/newcomer/complete            → 标记任务为已完成 {uid, step}
 *   POST /api/newcomer/claim               → 领取奖励 {uid, step}
 *   POST /api/newcomer/init                → 注册后初始化任务 {uid}
 */

header("Content-Type: application/json; charset=utf-8");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") { http_response_code(204); exit; }

// ─── DB 连接 ───
$config = parse_ini_file("/www/wwwroot/config/database.ini", true);
$dbHost = $config["database"]["host"] ?? "localhost";
$dbName = $config["database"]["name"] ?? "dalian_mica178_";
$dbUser = $config["database"]["user"] ?? "root";
$dbPass = $config["database"]["pass"] ?? "4PaB1bqgxHuz1I7FGxRSDmx4";

try {
    $pdo = new PDO("mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4", $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_OBJ,
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["code" => 500, "msg" => "数据库连接失败"]);
    exit;
}

// ─── 任务配置 ───
$TASKS = [
    1 => ["action" => "注册完成", "reward" => 10000, "need_share" => false],
    2 => ["action" => "起一卦并分享", "reward" => 20000, "need_share" => true],
    3 => ["action" => "玩游戏并分享", "reward" => 30000, "need_share" => true],
    4 => ["action" => "发起PK并分享", "reward" => 40000, "need_share" => true],
    5 => ["action" => "分享产品矩阵", "reward" => 50000, "need_share" => true],
];

$method = $_SERVER["REQUEST_METHOD"];
$action = $_GET["action"] ?? ($_POST["action"] ?? "");
$input = $method === "POST" ? json_decode(file_get_contents("php://input"), true) : $_GET;

// ─── 路由 ───

// GET /api/newcomer/tasks?uid=X
if ($method === "GET" && ($_GET["action"] ?? "") === "tasks") {
    $uid = (int)($_GET["uid"] ?? 0);
    if (!$uid) die(json_encode(["code" => 400, "msg" => "缺少uid"]));

    $stmt = $pdo->prepare("SELECT * FROM ims_yz_newcomer_tasks WHERE uid = ? ORDER BY step ASC");
    $stmt->execute([$uid]);
    $rows = $stmt->fetchAll();

    $steps = [];
    foreach ($rows as $r) {
        $steps[] = [
            "step" => (int)$r->step,
            "status" => (int)$r->status,
            "reward" => $TASKS[(int)$r->step]["reward"],
            "action" => $TASKS[(int)$r->step]["action"],
            "need_share" => $TASKS[(int)$r->step]["need_share"],
            "completed_at" => $r->completed_at ? date("Y-m-d H:i", $r->completed_at) : null,
            "claimed_at" => $r->claimed_at ? date("Y-m-d H:i", $r->claimed_at) : null,
        ];
    }

    $claimed = array_sum(array_map(fn($s) => $s["status"] === 2 ? $s["reward"] : 0, $steps));
    $completed = count(array_filter($steps, fn($s) => $s["status"] > 0));

    echo json_encode(["code" => 0, "data" => [
        "steps" => $steps,
        "total_reward" => 150000,
        "claimed" => $claimed,
        "completed" => $completed,
        "total_steps" => 5,
    ]]);
    exit;
}

// POST /api/newcomer/init — 注册后初始化任务
if ($method === "POST" && ($input["action"] ?? "") === "init") {
    $uid = (int)($input["uid"] ?? 0);
    if (!$uid) die(json_encode(["code" => 400, "msg" => "缺少uid"]));

    // 检查是否已初始化
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM ims_yz_newcomer_tasks WHERE uid = ?");
    $stmt->execute([$uid]);
    if ($stmt->fetchColumn() > 0) {
        die(json_encode(["code" => 0, "msg" => "已初始化"]));
    }

    $now = time();
    $pdo->beginTransaction();
    try {
        for ($step = 1; $step <= 5; $step++) {
            $pdo->prepare("INSERT INTO ims_yz_newcomer_tasks (uid, step, status, created_at) VALUES (?, ?, 0, ?)")
                ->execute([$uid, $step, $now]);
        }
        // 步骤①自动完成 + 发放
        $reward = $TASKS[1]["reward"];
        $pdo->prepare("UPDATE ims_yz_newcomer_tasks SET status = 2, completed_at = ?, claimed_at = ? WHERE uid = ? AND step = 1")
            ->execute([$now, $now, $uid]);
        $pdo->prepare("UPDATE ims_mc_members SET credit1 = credit1 + ? WHERE uid = ?")
            ->execute([$reward, $uid]);
        $pdo->prepare("INSERT INTO ims_yz_wallet_flow (uid, asset_type, amount, biz_type, status, remark, created_at) VALUES (?, 'credit1', ?, 'newcomer_reward', 'completed', ?, NOW())")
            ->execute([$uid, $reward, "新手任务①注册奖励 {$reward}🎮"]);
        $pdo->commit();
        echo json_encode(["code" => 0, "msg" => "初始化成功", "step1_reward" => $reward]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["code" => 500, "msg" => "初始化失败: " . $e->getMessage()]);
    }
    exit;
}

// POST /api/newcomer/complete — 标记步骤完成
if ($method === "POST" && ($input["action"] ?? "") === "complete") {
    $uid = (int)($input["uid"] ?? 0);
    $step = (int)($input["step"] ?? 0);
    if (!$uid || !$step || $step < 2 || $step > 5) {
        die(json_encode(["code" => 400, "msg" => "参数错误"]));
    }

    $now = time();
    $pdo->prepare("UPDATE ims_yz_newcomer_tasks SET status = 1, completed_at = ? WHERE uid = ? AND step = ? AND status = 0")
        ->execute([$now, $uid, $step]);

    if ($pdo->rowCount() > 0) {
        echo json_encode(["code" => 0, "msg" => "任务完成", "step" => $step, "reward" => $TASKS[$step]["reward"]]);
    } else {
        // 可能已经完成了
        echo json_encode(["code" => 0, "msg" => "已完成"]);
    }
    exit;
}

// POST /api/newcomer/claim — 领取奖励
if ($method === "POST" && ($input["action"] ?? "") === "claim") {
    $uid = (int)($input["uid"] ?? 0);
    $step = (int)($input["step"] ?? 0);
    if (!$uid || !$step) die(json_encode(["code" => 400, "msg" => "参数错误"]));

    $stmt = $pdo->prepare("SELECT status FROM ims_yz_newcomer_tasks WHERE uid = ? AND step = ?");
    $stmt->execute([$uid, $step]);
    $row = $stmt->fetch();

    if (!$row || $row->status !== 1) {
        die(json_encode(["code" => 400, "msg" => "任务未完成或已领取"]));
    }

    $reward = $TASKS[$step]["reward"];
    $now = time();

    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE ims_yz_newcomer_tasks SET status = 2, claimed_at = ? WHERE uid = ? AND step = ?")
            ->execute([$now, $uid, $step]);
        $pdo->prepare("UPDATE ims_mc_members SET credit1 = credit1 + ? WHERE uid = ?")
            ->execute([$reward, $uid]);
        $pdo->prepare("INSERT INTO ims_yz_wallet_flow (uid, asset_type, amount, biz_type, status, remark, created_at) VALUES (?, 'credit1', ?, 'newcomer_reward', 'completed', ?, NOW())")
            ->execute([$uid, $reward, "新手任务步{$step}奖励 {$reward}🎮"]);
        $pdo->commit();
        echo json_encode(["code" => 0, "msg" => "领取成功", "reward" => $reward]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["code" => 500, "msg" => "领取失败: " . $e->getMessage()]);
    }
    exit;
}

// POST /api/newcomer/auto-claim — 完成+领取一步到位
if ($method === "POST" && ($input["action"] ?? "") === "auto-claim") {
    $uid = (int)($input["uid"] ?? 0);
    $step = (int)($input["step"] ?? 0);
    if (!$uid || !$step || $step < 2 || $step > 5) {
        die(json_encode(["code" => 400, "msg" => "参数错误"]));
    }

    $now = time();
    $reward = $TASKS[$step]["reward"];

    $pdo->beginTransaction();
    try {
        $pdo->prepare("UPDATE ims_yz_newcomer_tasks SET status = 2, completed_at = ?, claimed_at = ? WHERE uid = ? AND step = ? AND status = 0")
            ->execute([$now, $now, $uid, $step]);
        if ($pdo->rowCount() === 0) {
            $pdo->rollBack();
            die(json_encode(["code" => 400, "msg" => "任务已完成或不存在"]));
        }
        $pdo->prepare("UPDATE ims_mc_members SET credit1 = credit1 + ? WHERE uid = ?")
            ->execute([$reward, $uid]);
        $pdo->prepare("INSERT INTO ims_yz_wallet_flow (uid, asset_type, amount, biz_type, status, remark, created_at) VALUES (?, 'credit1', ?, 'newcomer_reward', 'completed', ?, NOW())")
            ->execute([$uid, $reward, "新手任务步{$step}奖励 {$reward}🎮"]);
        $pdo->commit();
        echo json_encode(["code" => 0, "msg" => "恭喜获得 {$reward}🎮", "reward" => $reward]);
    } catch (Exception $e) {
        $pdo->rollBack();
        echo json_encode(["code" => 500, "msg" => "失败: " . $e->getMessage()]);
    }
    exit;
}

echo json_encode(["code" => -1, "msg" => "unknown action"]);
