/***********************
 * Surge 稳定版（无 return）
 ***********************/

const COOKIE_KEY = "yjb_cookie";
const AUTH_KEY = "yjb_auth";

/* =====================
   1. HTTP REQUEST
===================== */
if (typeof $request !== "undefined") {

  const cookie = $request.headers.cookie || $request.headers.Cookie;
  const auth = $request.headers.authorization;

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
      msg += "Auth 已更新\n";
      changed = true;
    }
  }

  if (changed) {
    $notification.post("养基宝", "登录态更新", msg.trim());
  }

  $done({});
}

/* =====================
   2. CRON TASK
===================== */
else {

  const url = "https://app-api.yangjibao.com/account_collect";

  const cookie = $persistentStore.read(COOKIE_KEY) || "";
  const auth = $persistentStore.read(AUTH_KEY) || "";

  const headers = {
    authorization: auth,
    cookie: cookie,
    "user-agent": "YJB/1.9.23 (iPhone16,1)",
    accept: "*/*"
  };

  $httpClient.get({ url, headers }, (err, resp, data) => {

    if (err) {
      $notification.post("资产监控", "请求失败", err);
      $done();
      return;
    }

    let obj;
    try {
      obj = JSON.parse(data);
    } catch (e) {
      $notification.post("资产监控", "解析失败", data.slice(0, 120));
      $done();
      return;
    }

    const d = obj.data || {};

    const total = Number(d.assets_collect || 0);
    const today = Number(d.today_income || 0);
    const accounts = d.account_data || [];

    let msg = "📊 资产监控\n\n";

    msg += `💰 总资产：${total.toFixed(2)}\n`;
    msg += `📈 今日收益：${today >= 0 ? "+" : ""}${today.toFixed(2)}\n`;

    for (const a of accounts) {
      msg += `${a.title} ${a.today_income >= 0 ? "+" : ""}${Number(a.today_income).toFixed(2)}\n`;
    }

    $notification.post("资产监控", "更新成功", msg);

    $done({});
  });
}