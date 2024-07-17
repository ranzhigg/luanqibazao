const token = ''
const cookie = ''
const keyword = ['栀子入仲夏', '\u6800\u5B50\u5165\u4EF2\u590F']
function exchange(keyword) {
  fetch('https://h5.gumingnc.com/newton-buyer/newton/buyer/ump/milk/tea/activity/fcfs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Referer': 'https://h5.gumingnc.com/',
      'Origin': 'https://h5.gumingnc.com',
      'Host': 'h5.gumingnc.com',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 MicroMessenger/6.8.0(0x16080000) NetType/WIFI MiniProgramEnv/Mac MacWechat/WMPF MacWechat/3.8.8(0x13080812) XWEB/1216',
      'Authorization': token,
      'Cookie': cookie
    },
    body: JSON.stringify({
      'activityId': 13,
      'channelCode': 20,
      'brandId': 1,
      'keyWordAnswer': keyword,
      'consumptionInventoryId': 329844439
    })
  }).then(res => res.text()).then((res) => {
    console.log(res)
  })
}
!(async () => {
  // 自行修改次数
  for (let i = 0; i < 1; i++) {
    exchange(keyword[0])
    exchange(keyword[1])
  }
})()
