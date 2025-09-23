(function () {
  if (!$response?.body) { $done({}); return; }

  // 五组固定颜色（十进制）
  const colors = [
    6970061,   // 灰蓝 #6A5ACD
    7372944,   // 石板灰 #708090
    12433259,  // 卡其 #BDB76B
    12357519,  // 玫瑰棕 #BC8F8F
    4620980    // 深海蓝 #4682B4
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
    console.log("[dm_color_random_fixed5] parse error:", e);
    $done({});
  }
})();