const url = "https://app-api.yangjibao.com/market/v1/fund/batch";

// ===== 鉴权 =====
const authorization = "ios:a141d33e-6523-4597-9559-ccaf537a02ba";

// ===== 时间戳 =====
const ts = Math.floor(Date.now() / 1000);

// ===== body =====
const body = "{}";

// ===== sign（先弱化）=====
const sign = "0";

// ===== headers =====
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

  let obj = {};
  try {
    obj = JSON.parse(data);
  } catch (e) {
    $notification.post("养基宝", "解析失败", data.slice(0, 200));
    $done();
    return;
  }

  // =========================
  // 统一提取 list（兼容所有结构）
  // =========================
  let list = [];

  if (Array.isArray(obj?.data)) {
    list = obj.data;
  } else if (Array.isArray(obj?.data?.list)) {
    list = obj.data.list;
  } else if (Array.isArray(obj?.data?.data)) {
    list = obj.data.data;
  } else if (Array.isArray(obj?.list)) {
    list = obj.list;
  }

  // 👉 防止空数据
  if (!list.length) {
    $notification.post(
      "养基宝",
      "⚠️ 未解析到数据",
      data.slice(0, 200)
    );
    $done();
    return;
  }

  let msg = "📊 今日基金估值\n\n";

  let total = 0;
  let profit = 0;

  const holdings = {
    "022184": 12000,
    "017436": 8000,
    "161130": 5000,
    "159937": 3000
  };

  for (const f of list) {

    const name = f?.short_name || "未知基金";
    const code = f?.code || "";

    const rate = Number(f?.nv_info?.gszzl);
    const safeRate = isNaN(rate) ? 0 : rate;

    msg += `${name} ${safeRate > 0 ? "+" : ""}${safeRate}%\n`;

    total += safeRate;

    const hold = holdings[code] || 0;
    profit += hold * safeRate / 100;
  }

  const avg = list.length ? (total / list.length) : 0;

  msg += `\n📈 平均涨跌：${avg.toFixed(2)}%`;
  msg += `\n💰 预估收益：${profit.toFixed(2)} 元`;
  msg += `\n🕒 ${new Date().toLocaleString()}`;

  if (avg >= 2) msg += `\n⚠️ 市场偏热`;
  if (avg <= -2) msg += `\n📉 回调压力`;

  $notification.post("养基宝", "基金更新", msg);

  $done();
});