(function () {
  if (!$response?.body) { $done({}); return; }

  // 五组性冷淡系淡色（十进制）
  const colors = [
    11193542,  // 淡灰蓝 #A9B7C6
    11513775,  // 雾霾灰 #B0B0B0
    14474460,  // 米白灰 #DCDCDC
    12632297,  // 浅卡其 #C0C0A9
    13484213   // 莫兰迪粉 #CDB7B5
  ];

  function pickColor() {
    let idx = Math.floor(Math.random() * colors.length);
    return String(colors[idx]);
  }

  try {
    let obj = JSON.parse($response.body);

    if (obj.comments && Array.isArray(obj.comments)) {
      obj.comments.forEach(c => {
        if (c.p) {
          let parts = c.p.split(",");
          if (parts.length >= 3 && parts[2] === "16777215") {
            parts[2] = pickColor();
            c.p = parts.join(",");
          }
        }
      });
    }

    $done({ body: JSON.stringify(obj) });
  } catch (e) {
    console.log("[dm_color_cold_tone] parse error:", e);
    $done({});
  }
})();