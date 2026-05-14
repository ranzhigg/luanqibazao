const url = "https://app-api.yangjibao.com/market/v1/fund/batch";

// ===== 固定鉴权 =====
const authorization = "ios:a141d33e-6523-4597-9559-ccaf537a02ba";

// ===== 动态时间戳 =====
const ts = Math.floor(Date.now() / 1000);

// ===== 请求体（当前抓包为空）=====
const body = JSON.stringify({});

// ===== MD5（弱签名版本）=====
function md5(str) {
  return $crypto.MD5(str);
}

// ⚠️ 先用通用拼接（很多 App 可用）
const sign = md5(body + ts);

// ===== headers =====
const headers = {
  "authorization": authorization,
  "request-time": String(ts),
  "request-sign": sign,
  "content-type": "application/json",
  "user-agent": "YJB/Surge",
  "accept": "*/*"
};

// ===== 请求 =====
$httpClient.post({ url, headers, body }, (err, resp, data) => {

  if (err) {
    $notification.post("基金监控", "请求失败", err);
    $done();
    return;
  }

  let obj;
  try {
    obj = JSON.parse(data);
  } catch (e) {
    $notification.post("基金监控", "解析失败", data.slice(0, 200));
    $done();
    return;
  }

  const list = obj.data || [];

  let msg = "📊 今日基金估值\n\n";
  let totalRate = 0;
  let profit = 0;

  // ===== 你的持仓（可改）=====
  const holdings = {
    "022184": 12000,
    "017436": 8000,
    "161130": 5000,
    "159937": 3000
  };

  for (const f of list) {

    const name = f.short_name || "未知基金";
    const code = f.code;
    const rate = parseFloat(f.nv_info?.gszzl || 0);

    msg += `${name} ${rate > 0 ? "+" : ""}${rate}%\n`;

    totalRate += rate;

    if (holdings[code]) {
      profit += holdings[code] * rate / 100;
    }
  }

  const avg = (totalRate / list.length).toFixed(2);

  msg += `\n📈 平均涨跌：${avg}%`;

  if (profit !== 0) {
    msg += `\n💰 预估收益：${profit.toFixed(2)} 元`;
  }

  if (avg >= 2) msg += `\n⚠️ 市场偏热`;
  if (avg <= -2) msg += `\n📉 回调压力`;

  msg += `\n🕒 ${new Date().toLocaleString()}`;

  $notification.post("养基宝", "基金更新", msg);

  $done();
});