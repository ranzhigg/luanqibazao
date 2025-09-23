(function () {
  if (!$response?.body) { $done({}); return; }

  function randColorDec() {
    let n;
    do { n = Math.floor(Math.random() * 0x1000000); } while (n === 0xFFFFFF);
    return String(n);
  }

  try {
    let obj = JSON.parse($response.body);

    if (obj.comments && Array.isArray(obj.comments)) {
      obj.comments.forEach(c => {
        if (c.p) {
          let parts = c.p.split(",");
          if (parts.length >= 3 && parts[2] === "16777215") {
            parts[2] = randColorDec();
            c.p = parts.join(",");
          }
        }
      });
    }

    $done({ body: JSON.stringify(obj) });
  } catch (e) {
    console.log("[dm_color_random] parse error:", e);
    $done({});
  }
})();