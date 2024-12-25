# V2EX 文章总结助手

一个帮助你快速总结 V2EX 文章内容的油猴脚本。

## 功能特点

- 自动提取文章内容并生成总结
- 支持 AI 模型配置
- 支持深色/浅色主题切换
- 自动获取所有页面的评论内容
- 支持重新生成总结
- 完全可配置的系统提示词
- 请求失败自动重试（最多3次）
- 请求超时保护（默认10秒）
- API 密码显示切换

## 安装

1. 首先安装 [Tampermonkey](https://www.tampermonkey.net/) 浏览器扩展
2. [点击这里](https://greasyfork.org/zh-CN/scripts/521732-v2ex-%E6%96%87%E7%AB%A0%E6%80%BB%E7%BB%93%E5%8A%A9%E6%89%8B) 安装脚本

## 使用方法

1. 访问任意 V2EX 文章页面
2. 在文章标题下方会看到 "总结 ✨" 和 "设置 ⚙️" 按钮
3. 首次使用需要点击设置按钮配置：
   - API URL: 你的 AI API 地址
   - API Key: 你的 API 密钥
   - 模型名称: 使用的模型名称
   - 系统提示词: 可选，默认提供

4. 配置完成后，点击 "总结" 按钮即可生成文章总结
   - 自动获取文章内容
   - 自动获取所有页面的评论
   - 综合生成总结内容

## 配置说明

- 支持任何兼容 OpenAI API 格式的接口
- 可自定义系统提示词来调整总结风格
- 支持跟随系统或手动切换深色模式
- 自动保存所有配置

## 展示图
![Imgur](https://i.imgur.com/aTekXId.png)
![Imgur](https://i.imgur.com/MAnEd5C.png)

## 作者

- GitHub：[https://github.com/Jandaes/v2ex_ai](https://github.com/Jandaes/v2ex_ai)

## 许可证

MIT License

## 更新日志

### v1.0
- 初始版本发布
- 基础总结功能
- 设置界面
- 深色模式支持

### v2.0
- 多页评论获取支持
- 请求失败重试机制
- 请求超时保护 
