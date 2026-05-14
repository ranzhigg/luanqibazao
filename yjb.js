/***********************
 * 养基宝 v2 稳定版
 ***********************/

const STORE_COOKIE = "yjb_cookie";
const STORE_AUTH = "yjb_auth";

/* =========================
   1. HTTP REQUEST：抓 cookie
========================= */
if (typeof $request !== "undefined") {

  const cookie = $request.headers["Cookie"] || $request.headers["cookie"];
  const auth = $request.headers["authorization"];

  let msg = "";

  if (cookie) {
    const old = $persistentStore.read(STORE_COOKIE);
    if (old !== cookie) {
      $persistentStore.write(cookie, STORE_COOKIE);
      msg += "Cookie 已更新\n";
    }
  }

  if (auth) {
    const old = $persistentStore.read(STORE_AUTH);
    if (old !== auth) {
      $persistentStore.write(auth, STORE_AUTH);
      msg += "Authorization 已更新\n";
    }
  }

  if (msg) {
    $notification.post("养基宝 v2", "登录态更新", msg);
  }

  $done();
  return;
}

/* =========================
   2. CRON：基金估值
========================= */

const url = "https://app-api.yangjibao.com/market/v1/fund/batch";

const cookie = $persistentStore.read(STORE_COOKIE) || "";
const auth = $persistentStore.read(STORE_AUTH) || "";

const holdings = {
  "022184": 12000,
  "017436": 8000,
  "161130": 5000,
  "159937": 3000
};

const body = JSON.stringify({
  funds: Object.keys(holdings)
});

const headers = {
  "authorization": auth,
  "cookie": cookie,
  "request-time": String(Math.floor(Date.now() / 1000)),
  "request-sign": "0",
  "content-type": "application/json",
  "user-agent": "Surge-YJB",
  "accept": "*/*"
};

$httpClient.post({ url, headers, body }, (err, resp, data) => {

  if (err) {
    $notification.post("养基宝 v2", "请求失败", err);
    $done();
    return;
  }

  let obj;
  try {
    obj = JSON.parse(data);
  } catch (e) {
    $notification.post("养基宝 v2", "解析失败", data.slice(0, 150));
    $done();
    return;
  }

  const list = obj?.data?.list || obj?.data || [];

  if (!Array.isArray(list) || list.length === 0) {
    $notification.post("养基宝 v2", "无数据", data.slice(0, 150));
    $done();
    return;
  }

  let msg = "📊 今日基金估值\n\n";

  let total = 0;
  let profit = 0;

  for (const f of list) {

    const name = f?.short_name || "未知";
    const code = f?.code || "";
    const rate = Number(f?.nv_info?.gszzl || 0) || 0;

    msg += `${name} ${rate > 0 ? "+" : ""}${rate.toFixed(2)}%\n`;

    total += rate;

    const hold = holdings[code] || 0;
    profit += hold * rate / 100;
  }

  const avg = list.length ? total / list.length : 0;

  msg += `\n📈 平均涨跌：${avg.toFixed(2)}%`;
  msg += `\n💰 预估收益：${profit.toFixed(2)} 元`;
  msg += `\n🕒 ${new Date().toLocaleString()}`;

  if (avg > 2) msg += `\n⚠️ 市场偏热`;
  if (avg < -2) msg += `\n📉 回调压力`;

  $notification.post("养基宝 v2", "基金更新", msg);

  $done();
});