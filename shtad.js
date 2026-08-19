const body = $response.body;

if (!body) {
  $done({});
  return;
}

let html = body;

// ============================================================
// 98堂 / sehuatang.org 去广告
// ============================================================

// 1. 删除顶部和底部广告中的具体广告链接
const adDomains = [
  'st7w6kz\\.com',
  'moulur\\.com',
  'jcsureyes\\.com',
  '8120355\\.cc',
  '5085336\\.top',
  '1444gy38\\.vip',
  'qpwoeirutylaksj\\.cc',
  'jfryc\\.com',
  'sh-yjf\\.com',
  'sfmmqz\\.cc',
  'ztctyh\\.com',
  'zzacjt\\.com',
  'fd5q27kyqb\\.com',
  'qwertyuioplkjhg\\.vip',
  'asdfghjklpoiuyt\\.net'
];

for (const domain of adDomains) {
  const re = new RegExp(
    '<div\\s+class=["\']item["\'][\\s\\S]*?' +
    '<a[^>]+href=["\'][^"\']*' +
    domain +
    '[^"\']*["\'][\\s\\S]*?<\\/div>',
    'gi'
  );

  html = html.replace(re, '');
}

// ============================================================
// 2. 删除动态广告 JS
// ============================================================

html = html.replace(
  /<script\s+src=["']\/api\.php\?mod=js&bid=(?:5|8|12|13|14|9)["'][^>]*>\s*<\/script>/gi,
  ''
);

// ============================================================
// 3. 删除轮播里的广告 li
// ============================================================

html = html.replace(
  /<li>\s*<a[^>]+(?:sfmmqz\.cc|ztctyh\.com|zzacjt\.com)[^>]*>[\s\S]*?<\/a>\s*<\/li>/gi,
  ''
);

// ============================================================
// 4. 强制隐藏广告容器
//
// 这是关键。
// 即使上面的 HTML 删除没有把外层 div 完整抠掉，
// CSS 也会让它完全不占视觉空间。
// ============================================================

const adCSS = `
<style id="sht-adblock">
.show-text,
.n5_jujiao,
.n5_mohd,
.n5_tbys,
.n5_tbxj,
.n5_ssymdb,
#n5_mohd,
.show-text.cl {
    display: none !important;
    visibility: hidden !important;
    height: 0 !important;
    min-height: 0 !important;
    max-height: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
}
</style>
`;

if (/<\/head>/i.test(html)) {
  html = html.replace(/<\/head>/i, adCSS + '</head>');
} else {
  html = adCSS + html;
}

// ============================================================
// 5. 清理明显残留的广告容器
// ============================================================

html = html.replace(
  /<div\s+class=["']show-text\s+cl["'][^>]*>\s*<\/div>/gi,
  ''
);

html = html.replace(
  /<div\s+class=["']n5_jujiao["'][^>]*>\s*<\/div>/gi,
  ''
);

// ============================================================

$done({
  body: html
});