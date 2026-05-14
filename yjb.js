const url = "https://app-api.yangjibao.com/market/v1/fund/batch";

const authorization = "ios:a141d33e-6523-4597-9559-ccaf537a02ba";
const ts = Math.floor(Date.now() / 1000);

// ===== 你的持仓 =====
const holdings = {
  "022184": 12000,
  "017436": 8000,
  "161130": 5000,
  "159937": 3000
};

// ===== 提取 fund list =====
const fundIds = Object.keys(holdings);

// ===== 正确 body（关键修复）=====
const bodyObj = {
  funds: fundIds
};

const body = JSON.stringify(bodyObj);

// ===== sign（先弱化）=====
const sign = "0";

const headers = {
  "authorization": authorization,
  "request-time": String(ts),
  "request-sign": sign,
  "content-type": "application/json",
  "user-agent": "YJB/Surge",
  "accept": "*/*"
};

$httpClient.post({ url, headers, body }, (err, resp, data) => {

  if (err) {
    $notification.post("养基宝", "请求失败", err);
    $done();
    return;
  }

  let obj;
  try {
    obj = JSON.parse(data);
  } catch (e) {
    $notification.post("养基宝", "解析失败", data.slice(0, 200));
    $done();
    return;
  }

  // ===== 兼容数据结构 =====
  const list =
    obj?.data?.list ||
    obj?.data ||
    obj?.list ||
    [];

  if (!Array.isArray(list) || !list.length) {
    $notification.post("养基宝", "⚠️ 无数据返回", data.slice(0, 200));
    $done();
    return;
  }

  let msg = "📊 今日基金估值\n\n";

  let total = 0;
  let profit = 0;

  for (const f of list) {

    const name = f?.short_name || "未知基金";
    const code = f?.code;
    const rate = Number(f?.nv_info?.gszzl || 0);

    msg += `${name} ${rate > 0 ? "+" : ""}${rate}%\n`;

    total += rate;

    if (holdings[code]) {
      profit += holdings[code] * rate / 100;
    }
  }

  const avg = total / list.length;

  msg += `\n📈 平均涨跌：${avg.toFixed(2)}%`;
  msg += `\n💰 预估收益：${profit.toFixed(2)} 元`;
  msg += `\n🕒 ${new Date().toLocaleString()}`;

  $notification.post("养基宝", "基金更新", msg);

  $done();
});