from pagermaid.enums import Client, Message
from pagermaid.listener import listener
import os

channel_id_file = "channel_ids.txt"

def save_channel_ids(channel_ids):
    with open(channel_id_file, 'w') as file:
        for channel_id in channel_ids:
            file.write(str(channel_id) + "\n")

def load_channel_ids():
    channel_ids = []
    if os.path.exists(channel_id_file):
        with open(channel_id_file, 'r') as file:
            for line in file:
                channel_ids.append(int(line.strip()))
    return channel_ids

@listener(
    command="forward_ID",
    description="设置默认转存的频道ID",
    parameters="[channel_id]",
    privileges={"plugins.forward"}
)
async def set_channel_id(bot: Client, message: Message):
    params = message.parameter

    if len(params) < 1:
        await message.edit("请提供频道ID 使用方式：`,forward_ID [channel_id]`")
        return await message.delay_delete(10)

    channel_ids = [int(param) for param in params]
    save_channel_ids(channel_ids)
    await message.edit(f"已设置默认转存频道为 {channel_ids}")
    await message.delay_delete(3)

@listener(
    command="forward",
    description="将回复的消息（文字、图片、文件等）搬运到已设置的频道（初次使用请用指令 ,forward_ID [channel_id]设置转存的目标频道）",
    parameters="",
    privileges={"plugins.forward"}
)
async def forward(bot: Client, message: Message):
    channel_ids = load_channel_ids()

    if not channel_ids:
        await message.edit("频道ID未设置 请首先使用 `,forward_ID [channel_id]` 设置频道")
        return await message.delay_delete(10)

    if message.reply_to_message:
        await message.edit(f"正在搬运中...")
        try:
            for channel_id in channel_ids:
                await message.reply_to_message.forward(channel_id)
            await message.edit(f"盗取联合国机密信息成功 🎉")
            await message.delay_delete(2)
        except Exception as e:
            await message.edit(f"盗取联合国机密信息失败：{str(e)}")
            await message.delay_delete(2)
    else:
        await message.edit("请回复您需要盗取的目标文件")
        await message.delay_delete(2)