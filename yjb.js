/***********************
 * 养基宝 Pro 系统
 * 登录态 + 资产监控
 ***********************/

const COOKIE_KEY = "yjb_cookie";
const AUTH_KEY = "yjb_auth";
const LAST_NOTIFY_KEY = "yjb_last_notify";

/* =========================
   1️⃣ 登录态刷新（HTTP REQUEST）
========================= */
if ($request) {

  const cookie = $request.headers["cookie"] || $request.headers["Cookie"];
  const auth = $request.headers["authorization"];

  let msg = "";
  let changed = false;

  if (cookie) {
    const old = $persistentStore.read(COOKIE_KEY);
    if (old !== cookie) {
      $persistentStore.write(cookie, COOKIE_KEY);
      msg += "Cookie 已更新\n";
      changed = true;
    }
  }

  if (auth) {
    const old = $persistentStore.read(AUTH_KEY);
    if (old !== auth) {
      $persistentStore.write(auth, AUTH_KEY);
      msg += "Authorization 已更新\n";
      changed = true;
    }
  }

  if (changed) {
    $notification.post("养基宝 Pro", "登录态刷新成功", msg.trim());
  }

  $done({});
  return;
}

/* =========================
   2️⃣ 资产监控（CRON）
========================= */

const url = "https://app-api.yangjibao.com/account_collect";

const cookie = $persistentStore.read(COOKIE_KEY) || "";
const auth = $persistentStore.read(AUTH_KEY) || "";

const headers = {
  "authorization": auth,
  "cookie": cookie,
  "user-agent": "YJB/1.9.23 (iPhone16,1)",
  "content-type": "application/json",
  "accept": "*/*"
};

$httpClient.get({ url, headers }, (err, resp, data) => {

  if (err) {
    $notification.post("养基宝 Pro", "请求失败", err);
    $done();
    return;
  }

  let obj;
  try {
    obj = JSON.parse(data);
  } catch (e) {
    $notification.post("养基宝 Pro", "解析失败", data.slice(0, 120));
    $done();
    return;
  }

  const d = obj?.data || {};

  const total = Number(d?.assets_collect || 0);
  const today = Number(d?.today_income || 0);
  const accounts = d?.account_data || [];

  // =========================
  // 防空数据
  // =========================
  if (!total && !today) {
    $notification.post("养基宝 Pro", "异常返回", "可能cookie失效或接口被拦截");
    $done();
    return;
  }

  let msg = "📊 资产监控 Pro\n\n";

  msg += `💰 总资产：${total.toFixed(2)}\n`;
  msg += `📈 今日收益：${today >= 0 ? "+" : ""}${today.toFixed(2)}\n`;

  if (Array.isArray(accounts) && accounts.length > 0) {

    msg += "\n📂 账户明细：\n";

    for (const a of accounts) {

      const name = a?.title || "未知账户";
      const income = Number(a?.today_income || 0);
      const rate = Number(a?.today_income_rate || 0);

      msg += `${name} ${income >= 0 ? "+" : ""}${income.toFixed(2)} (${(rate * 100).toFixed(2)}%)\n`;
    }
  }

  // =========================
  // 风控提示
  // =========================
  if (today > 50) msg += "\n⚠️ 异常高收益（注意波动）";
  if (today < -50) msg += "\n📉 大幅回撤";

  msg += `\n🕒 ${new Date().toLocaleString()}`;

  // =========================
  // 防刷屏（只在变化时通知）
  // =========================
  const last = $persistentStore.read(LAST_NOTIFY_KEY);
  const current = `${total}-${today}`;

  if (last !== current) {
    $persistentStore.write(current, LAST_NOTIFY_KEY);
    $notification.post("养基宝 Pro", "资产更新", msg);
  }

  $done();
});