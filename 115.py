import os

# 115 本地目录（你的 AV 文件夹）
root_dir = "/data/CloudDrive/115/AV"

# 存放 .strm 文件的目录
strm_root = "/data/CloudDrive/115/AV_strm"

# 支持的视频格式
video_exts = {".mp4", ".mkv", ".avi", ".mov", ".flv", ".wmv"}

def create_strm_files(directory):
    """ 遍历目录，为所有视频文件生成 .strm 文件 """
    for foldername, _, filenames in os.walk(directory):
        for filename in filenames:
            if any(filename.lower().endswith(ext) for ext in video_exts):
                video_path = os.path.join(foldername, filename)
                
                # 计算 .strm 文件的存放路径（保持相对目录结构）
                relative_path = os.path.relpath(video_path, root_dir)
                strm_path = os.path.join(strm_root, relative_path + ".strm")
                
                # 确保 .strm 文件所在的目录存在
                os.makedirs(os.path.dirname(strm_path), exist_ok=True)
                
                # 写入视频文件路径到 .strm 文件
                with open(strm_path, "w", encoding="utf-8") as f:
                    f.write(video_path)

                print(f"✅ 生成: {strm_path}")

# 执行脚本
if __name__ == "__main__":
    create_strm_files(root_dir)
    print("🎉 .strm 文件生成完成！")