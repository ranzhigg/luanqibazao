import hashlib
import json
import random
import time
import requests
import ddddocr
import base64

req = requests.Session()
userList = []

tyqhCookie = "账号1的thirdId#账号1的wid#账号1的备注@账号2的thirdId#账号2的wid#账号2的备注@账号3的thirdId#账号3的wid#账号3的备注@账号4的thirdId#账号4的wid#账号4的备注"

key = "BxzTx45uIGT25TTHIIBU2"
client_id = "game"
xpos = 0
headers = {
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.48(0x1800302d) NetType/4G Language/zh_CN miniProgram/wx532ecb3bdaaf92f9',
    'Referer': 'https://thekingoftomato.ioutu.cn/',
    'Origin': 'https://thekingoftomato.ioutu.cn',
    'Authorization': ''
}


def read_env(env):
    accounts = env.split("@")
    for account in accounts:
        parts = account.split("#")
        if len(parts) < 3:
            continue

        user_item = {
            "thirdId": parts[0],
            "wid": int(parts[1]),
            "name": parts[2]
        }
        userList.append(user_item)

    return True


def login(user):
    url = 'https://qiehuang-apig.xiaoyisz.com/qiehuangsecond/ga/public/api/login'
    data = {
        'thirdId': user['thirdId'],
        'wid': user['wid']
    }
    sign = gen_sign({}, data)
    headers.update(sign)

    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        res = response.json()
        token = res['data']['token']
        # print(f'✅ 成功获取Token: {token}')
        headers['Authorization'] = token
        req.headers.update(headers)
    else:
        print('⛔️ 请求失败，状态码:', response.status_code)


def lottery():
    url = 'https://qiehuang-apig.xiaoyisz.com/qiehuangsecond/ga/activity/draw'
    params = {
        'id': 58
    }
    sign = gen_sign(params)
    headers.update(sign)
    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        res = response.json()
        code = res['code']
        if code == 0:
            prize = res['data']['name']
            print(f'🎉 抽奖成功,获得奖品: {prize}')
        elif code == 4000:
            print('⏰ 开始进行滑块验证...')
            slideImgInfo = res['data']['slideImgInfo']
            slidingImage = slideImgInfo['slidingImage']
            backImage = slideImgInfo['backImage']
            sliding = base64.b64decode(slidingImage)
            back = base64.b64decode(backImage)
            with open('./sliding.png', 'wb') as f:
                f.write(sliding)
            with open('./back.png', 'wb') as f:
                f.write(back)
            det = ddddocr.DdddOcr(det=False, ocr=False, show_ad=False)
            with open('./sliding.png', 'rb') as f:
                target_bytes = f.read()
            with open('./back.png', 'rb') as f:
                background_bytes = f.read()

            slide_result = det.slide_match(target_bytes, background_bytes, simple_target=True)
            xpos = slide_result['target'][0]
            checkCapCode(xpos)
        else:
            message = res['message']
            print(f'⛔抽奖失败: {message}')
    else:
        print('⛔️ 请求失败，状态码:', response.status_code)


def checkCapCode(xpos):
    url = 'https://qiehuang-apig.xiaoyisz.com/qiehuangsecond/ga/checkUserCapCode'
    data = {
        'xpos': xpos
    }
    sign = gen_sign({}, data)
    headers.update(sign)
    response = requests.post(url, headers=headers, json=data)
    if response.status_code == 200:
        res = response.json()
        code = res['code']
        if code == 0:
            print('✅ 滑块验证通过')
            lottery()
        else:
            print('🚀 滑块验证未通过，开始重新验证...')
            checkCapCode(xpos)
    else:
        print('⛔️ 请求失败，状态码:', response.status_code)


def gen_sign(params={}, body=None):
    query = []
    for item in sorted(params.keys()):
        if isinstance(params[item], dict):
            query.append(f"{item}={json.dumps(params[item])}")
        else:
            query.append(f"{item}={params[item]}")

    timestamp = int(time.time() * 1000)
    key_array = list(key)
    millisecond = str(timestamp)[-3:]

    for num in millisecond:
        key_array.insert(int(num), num)

    secret = hashlib.md5("".join(key_array).encode()).hexdigest()
    sign_obj = {
        "client_id": client_id,
        "nonstr": randomString(16),
        "timestamp": timestamp,
        "body": json.dumps(body) if body else "",
        "query": "&".join(query) if query else "",
        "secret": secret
    }
    sign_str = "|".join(str(value) for value in sign_obj.values())

    return {
        "client_id": client_id,
        "timestamp": str(sign_obj["timestamp"]),
        "nonstr": sign_obj["nonstr"],
        "sign": hashlib.md5(sign_str.encode()).hexdigest().upper()
    }


def randomString(length, chars="abcdef0123456789"):
    return ''.join(random.choice(chars) for _ in range(length))


if __name__ == '__main__':
    print(f"🔔统一茄皇, 开始...")
    read_env(tyqhCookie)
    print(f"⚙️ 发现 {len(userList)} 个账号")
    for user in userList:
        print(f"------ {user['name']} 开始执行任务 ------")
        login(user)
        for i in range(5):
            print(f"🚀 开始第 {i + 1} 次抽奖...")
            lottery()

    print(f"🔔统一茄皇, 结束...")
