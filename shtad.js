const body = $response.body;

if (!body) {
  $done({});
  return;
}

let html = body;

// 1. 删除顶部广告列表
html = html.replace(
  /<div\s+class=["']show-text\s+cl["'][^>]*>[\s\S]*?<\/div>\s*<div\s+class=["']h10["']/gi,
  '<div class="h10"'
);

// 2. 删除中间整个轮播横幅区域
html = html.replace(
  /<div\s+class=["']n5_jujiao["'][^>]*>[\s\S]*?<\/div>\s*<div\s+class=["']footer_menu["']/gi,
  '<div class="footer_menu"'
);

// 3. 删除底部重复广告
html = html.replace(
  /<div\s+class=["']show-text\s+cl["'][^>]*>[\s\S]*?<\/div>\s*<div\s+class=["']n5_ssymdb["']/gi,
  '<div class="n5_ssymdb"'
);

// 4. 删除动态广告/推荐模块
html = html.replace(
  /<script\s+src=["']\/api\.php\?mod=js&bid=(?:5|8|12|13|14|9)["'][^>]*><\/script>/gi,
  ''
);

// 5. 保险：删除残留的广告轮播初始化
html = html.replace(
  /<script[^>]*>[\s\S]*?TouchSlide\s*\(\s*\{[\s\S]*?slideCell\s*:\s*["']#n5_mohd["'][\s\S]*?<\/script>/gi,
  ''
);

// 6. 如果上面的节点因为模板改版没有匹配，再按具体广告链接清理
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
    '<div\\s+class=["\']item["\'][\\s\\S]*?<a[^>]+href=["\'][^"\']*' +
    domain +
    '[^"\']*["\'][\\s\\S]*?<\\/div>',
    'gi'
  );
  html = html.replace(re, '');
}

// 7. 清理可能留下的空广告容器
html = html.replace(
  /<div\s+class=["']show-text\s+cl["'][^>]*>\s*<\/div>/gi,
  ''
);

html = html.replace(
  /<div\s+class=["']n5_jujiao["'][^>]*>\s*<\/div>/gi,
  ''
);

$done({
  body: html
});