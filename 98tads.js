// 98t_remove_ads.js
let body = $response.body;

// 去除顶部广告区
body = body.replace(/<div class="show-text[^>]*?>[\s\S]*?<\/div>/gi, '');

// 去除幻灯片广告区
body = body.replace(/<div class="n5_jujiao">[\s\S]*?<\/div>/gi, '');

// 去除动态广告 script
body = body.replace(/<script[^>]*?src="\/api\.php\?mod=js[^>]*?><\/script>/gi, '');

// 去除 footer_menu 中的推广
body = body.replace(/<div class="footer_menu">[\s\S]*?<\/div>/gi, '');

// 进一步优化空行
body = body.replace(/\n\s*\n/g, '\n');

$done({ body });