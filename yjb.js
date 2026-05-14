const url = "https://app-api.yangjibao.com/market/v1/fund/batch";

// ===== 动态读取 =====
const cookie = $persistentStore.read("yjb_cookie") || "";
const auth = $persistentStore.read("yjb_auth") || "";

const ts = Math.floor(Date.now() / 1000);

const body = JSON.stringify({
  funds: ["022184","017436","161130","159937"]
});

// ⚠️ 如果 sign 还不稳定先写死
const sign = "0";

const headers = {
  "authorization": auth,
  "cookie": cookie,
  "request-time": String(ts),
  "request-sign": sign,
  "content-type": "application/json",
  "user-agent": "YJB/Surge"
};

$httpClient.post({ url, headers, body }, (err, resp, data) => {

  if (err) {
    $notification.post("基金", "请求失败", err);
    $done();
    return;
  }

  let obj = JSON.parse(data);

  let list = obj?.data?.list || obj?.data || [];

  if (!Array.isArray(list) || !list.length) {
    $notification.post("基金", "无数据", data.slice(0, 200));
    $done();
    return;
  }

  let msg = "📊 今日基金估值\n\n";

  let total = 0;

  for (const f of list) {
    const name = f.short_name;
    const rate = Number(f?.nv_info?.gszzl || 0);

    msg += `${name} ${rate > 0 ? "+" : ""}${rate}%\n`;
    total += rate;
  }

  msg += `\n📈 平均涨跌：${(total / list.length).toFixed(2)}%`;
  msg += `\n🕒 ${new Date().toLocaleString()}`;

  $notification.post("养基宝", "基金更新", msg);

  $done();
});