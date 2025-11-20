
[mitm]
hostname = api.bevol.com


try {
  let obj = JSON.parse($response.body);
  const url = $request.url;

  /* ============================
      首页横幅广告 / AI 内容
  ============================ */
  if (url.includes("/appmain/app/home/page")) {
    obj.result.centerBannerAdvert = [];
    obj.result.programmaticAdvertising = null;
    delete obj.result.aiEntranceConfig;
    delete obj.result.aiEntranceInputTipDefault;
    delete obj.result.questionnaireMap;

    for (const k in obj.result) {
      if (k.toLowerCase().includes("ai")) delete obj.result[k];
    }

    /* 删除 小样试用 & 美妆优选 */
    if (obj.result.homePageSmallSampleTest) {
      delete obj.result.homePageSmallSampleTest;  // 小样试用
    }
    if (obj.result.homePageBeautySelection) {
      delete obj.result.homePageBeautySelection;  // 美妆优选
    }
  }

  /* ============================
      个人中心页面
  ============================ */
  if (url.includes("/personal/page")) {
    if (obj.result.personal_center_banner)
      obj.result.personal_center_banner = [];

    if (obj.result.programmaticAdvertising)
      obj.result.programmaticAdvertising = [];

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

  /* ============================
      启动广告
  ============================ */
  if (url.includes("/appmain/app/home/launch")) {
    obj.result.openAppAdvert.openAdvertOnline = [];
    obj.result.openAdKeepTime = 0;
  }

  /* ============================
      用户信息（关闭开屏）
  ============================ */
  if (url.includes("/usercenter/account/info")) {
    if (obj.result) {
      obj.result.isAdOpen = 0;
      obj.result.isMember = true;
      obj.result.isMlxxMember = 1;
    }
  }

  /* ============================
      试用盒页面
  ============================ */
  if (url.includes("/trialbox/shop/app/homePage")) {
    if (obj.result.bannerImages) {
      obj.result.bannerImages = [];  // 顶部广告
    }
    if (obj.result.moduleBannerImages) {
      obj.result.moduleBannerImages = [];
    }
  }

  $done({ body: JSON.stringify(obj) });

} catch (e) {
  $done({ body: $response.body });
}