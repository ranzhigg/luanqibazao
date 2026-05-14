const url = "https://app-api.yangjibao.com/market/v1/fund/batch";

const ts = Math.floor(Date.now() / 1000);

const headers = {
  "authorization": "ios:a141d33e-6523-4597-9559-ccaf537a02ba",
  "request-time": String(ts),
  "request-sign": "0",   // 关键：绕过crypto
  "content-type": "application/json",
  "user-agent": "YJB/Surge",
  "accept": "*/*"
};

$httpClient.post({ url, headers, body: "{}" }, (err, resp, data) => {

  if (err) {
    $notification.post("基金监控", "请求失败", err);
    $done();
    return;
  }

  let obj = JSON.parse(data);
  let list = obj.data || [];

  let msg = "📊 今日基金估值\n\n";

  let total = 0;

  const holdings = {
    "022184": 12000,
    "017436": 8000,
    "161130": 5000,
    "159937": 3000
  };

  let profit = 0;

  for (const f of list) {
    let name = f.short_name;
    let code = f.code;
    let rate = parseFloat(f.nv_info?.gszzl || 0);

    msg += `${name} ${rate > 0 ? "+" : ""}${rate}%\n`;

    total += rate;

    if (holdings[code]) {
      profit += holdings[code] * rate / 100;
    }
  }

  msg += `\n📈 平均涨跌：${(total / list.length).toFixed(2)}%`;
  msg += `\n💰 预估收益：${profit.toFixed(2)} 元`;
  msg += `\n🕒 ${new Date().toLocaleString()}`;

  $notification.post("养基宝", "基金更新", msg);

  $done();
});