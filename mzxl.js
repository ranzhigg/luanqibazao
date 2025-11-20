/* 
 * 美丽修行
 * 广告处理

[rewrite_local]
^https:\/\/api\.bevol\.com\/(?:appmain\/app\/home\/page|usercenter\/account\/info|personal\/page|appmain\/app\/home\/launch|trialbox\/shop\/app\/homePage)$ url script-response-body https://raw.githubusercontent.com/Yu9191/Rewrite/refs/heads/main/mlxx.js

[mitm]
hostname = api.bevol.com
*/

try {
  let obj = JSON.parse($response.body);
  const url = $request.url;

  /* =============================
   * 首页（彻底清干净）
   =============================*/
  if (url.includes("/appmain/app/home/page")) {

    // 删除广告 & AI & 优选 & 小样 & 问卷等所有额外模块
    const removeKeys = [
      "centerBannerAdvert",
      "programmaticAdvertising",
      "aiEntranceConfig",
      "aiEntranceInputTipDefault",
      "questionnaireMap",
      "homePageSmallSampleTest",      // 小样试用
      "homePageBeautySelection",      // 美妆优选
      "small_sample",                 // 某些版本小样字段
      "beauty_selection",             // 兼容写法
      "aiArea",
      "aiConfig",
      "aiModule"
    ];

    removeKeys.forEach(k => {
      if (obj.result && obj.result[k] !== undefined) {
        delete obj.result[k];
      }
    });

    // 删除所有包含 ai 的字段（大小写通杀）
    for (const k in obj.result) {
      if (k.toLowerCase().includes("ai")) delete obj.result[k];
    }

    // 删除所有广告相关字段（兼容未来新增）
    for (const k in obj.result) {
      if (k.toLowerCase().includes("ad")) delete obj.result[k];
    }

    // 删除可能出现的新组件
    if (Array.isArray(obj.result.modules)) {
      obj.result.modules = obj.result.modules.filter(m => {
        const name = JSON.stringify(m).toLowerCase();
        return !(
          name.includes("ad") ||
          name.includes("ai") ||
          name.includes("sample") ||
          name.includes("trial") ||
          name.includes("beauty")
        );
      });
    }
  }

  /* =============================
   * 个人中心
   =============================*/
  if (url.includes("/personal/page")) {
    if (obj.result.personal_center_banner) obj.result.personal_center_banner = [];
    if (obj.result.programmaticAdvertising) obj.result.programmaticAdvertising = [];

    if (obj.result.memberRights) {
      obj.result.memberRights.isMember = true;
      obj.result.memberRights.memberButtonText = "你已是会员";
      obj.result.memberRights.memberRightMoreURL = "";
    }

    if (obj.result.personalPageMlxxMember) {
      obj.result.personalPageMlxxMember.mlxx_member_bubble_text = "已开通";
      obj.result.personalPageMlxxMember.mlxx_member_tips = "会员有效";
      obj.result.personalPageMlxxMember.mlxx_member_descp = "[]";
    }
  }

  /* =============================
   * 启动页广告
   =============================*/
  if (url.includes("/appmain/app/home/launch")) {
    obj.result.openAppAdvert.openAdvertOnline = [];
    obj.result.openAdKeepTime = 0;
  }

  /* =============================
   * 用户信息（开屏关闭）
   =============================*/
  if (url.includes("/usercenter/account/info")) {
    if (obj.result) {
      obj.result.isAdOpen = 0;
      obj.result.isMember = true;
      obj.result.isMlxxMember = 1;
    }
  }

  /* =============================
   * 试用盒
   =============================*/
  if (url.includes("/trialbox/shop/app/homePage")) {
    if (obj.result.bannerImages) obj.result.bannerImages = [];
    if (obj.result.moduleBannerImages) obj.result.moduleBannerImages = [];
  }

  $done({ body: JSON.stringify(obj) });

} catch (e) {
  $done({ body: $response.body });
}