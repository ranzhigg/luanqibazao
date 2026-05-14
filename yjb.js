/**
 * Surge 标准结构版本
 * 不混用 return / 不污染执行流
 */

const COOKIE_KEY = "yjb_cookie";
const AUTH_KEY = "yjb_auth";

/* =========================
   1. HTTP REQUEST：抓 cookie
========================= */
if ($request) {

  const cookie = $request.headers["cookie"] || $request.headers["Cookie"];
  const auth = $request.headers["authorization"];

  let msg = "";

  if (cookie) {
    const old = $persistentStore.read(COOKIE_KEY);
    if (old !== cookie) {
      $persistentStore.write(cookie, COOKIE_KEY);
      msg += "Cookie 已更新\n";
    }
  }

  if (auth) {
    const old = $persistentStore.read(AUTH_KEY);
    if (old !== auth) {
      $persistentStore.write(auth, AUTH_KEY);
      msg += "Authorization 已更新\n";
    }
  }

  if (msg.length > 0) {
    $notification.post("养基宝", "登录态更新", msg);
  }

  $done({});
  return;
}

/* =========================
   2. CRON：基金推送
========================= */
if ($task) {

  const url = "https://app-api.yangjibao.com/market/v1/fund/batch";

  const cookie = $persistentStore.read(COOKIE_KEY) || "";
  const auth = $persistentStore.read(AUTH_KEY) || "";

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
    "user-agent": "Surge",
    "accept": "*/*"
  };

  $httpClient.post({ url, headers, body }, (err, resp, data) => {

    if (err) {
      $notification.post("养基宝", "请求失败", err);
      $done({});
      return;
    }

    let obj;
    try {
      obj = JSON.parse(data);
    } catch (e) {
      $notification.post("养基宝", "解析失败", data.slice(0, 120));
      $done({});
      return;
    }

    const list = obj?.data?.list || obj?.data || [];

    if (!Array.isArray(list) || list.length === 0) {
      $notification.post("养基宝", "无数据", data.slice(0, 120));
      $done({});
      return;
    }

    let msg = "📊 今日基金估值\n\n";

    let total = 0;
    let profit = 0;

    for (let i = 0; i < list.length; i++) {

      const f = list[i];

      const name = f?.short_name || "未知基金";
      const code = f?.code || "";
      const rate = Number(f?.nv_info?.gszzl || 0) || 0;

      msg += name + " " + (rate > 0 ? "+" : "") + rate.toFixed(2) + "%\n";

      total += rate;

      const hold = holdings[code] || 0;
      profit += hold * rate / 100;
    }

    const avg = list.length ? total / list.length : 0;

    msg += "\n📈 平均涨跌：" + avg.toFixed(2) + "%";
    msg += "\n💰 预估收益：" + profit.toFixed(2) + " 元";
    msg += "\n🕒 " + new Date().toLocaleString();

    $notification.post("养基宝", "基金更新", msg);

    $done({});
  });

  return;
}

/* fallback */
$done({});