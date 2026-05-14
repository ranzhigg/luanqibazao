const url = "https://app-api.yangjibao.com/account_collect";

// ===== 请求头（如需cookie可后续加）=====
const headers = {
  "content-type": "application/json",
  "user-agent": "Surge-Asset"
};

// ===== 请求 =====
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

  // =========================
  // ✔ 精确匹配你的 JSON结构
  // =========================
  const d = obj?.data || {};

  const total = Number(d?.assets_collect || 0);
  const today = Number(d?.today_income || 0);
  const accounts = d?.account_data || [];

  let msg = "📊 资产收益报告\n\n";

  msg += `💰 总资产：${total.toFixed(2)}\n`;
  msg += `📈 今日收益：${today >= 0 ? "+" : ""}${today.toFixed(2)}\n`;

  // =========================
  // ✔ 账户明细
  // =========================
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
  // ✔ 状态判断
  // =========================
  if (today > 20) {
    msg += "\n⚠️ 今日收益较强";
  } else if (today < -20) {
    msg += "\n📉 今日回撤明显";
  }

  msg += `\n🕒 ${new Date().toLocaleString()}`;

  // =========================
  // ✔ Surge 通知
  // =========================
  $notification.post("资产监控", "更新成功", msg);

  $done();
});