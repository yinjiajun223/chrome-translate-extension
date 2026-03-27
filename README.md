# 划词翻译插件

一个简洁的 Chrome 划词翻译插件，支持选中英文文本后一键翻译成中文。

## 功能特性

- 📝 选中英文文本后自动显示翻译按钮
- 🎯 按钮跟随鼠标选区位置
- 🌐 使用 MyMemory 免费 API 翻译
- ✨ 现代简洁的 UI 设计
- 🔄 点击页面其他地方自动关闭
- 💻 使用 Chrome Manifest V3

## 安装方法

### 方法一：开发者模式安装

1. 下载本项目到本地
2. 打开 Chrome，访问 `chrome://extensions/`
3. 开启右上角的「开发者模式」
4. 点击「加载已解压的扩展程序」
5. 选择项目文件夹 `chrome-translate-extension`

### 方法二：打包安装

1. 在 `chrome://extensions/` 页面点击「打包扩展程序」
2. 选择项目文件夹
3. 生成 `.crx` 文件后拖入 Chrome 安装

## 文件结构

```
chrome-translate-extension/
├── manifest.json      # 插件配置
├── content.js        # 内容脚本（处理选区和 UI）
├── background.js     # 后台脚本（处理翻译 API）
└── styles.css       # 样式文件
```

## 使用方法

1. 安装插件后，在任意英文网页选中单词或句子
2. 选区附近会自动出现「翻译」按钮
3. 点击按钮即可查看中文翻译
4. 点击页面其他区域自动关闭翻译结果

## 技术栈

- Chrome Extension Manifest V3
- 原生 JavaScript
- MyMemory 翻译 API

## 注意事项

- 仅支持英文到中文翻译
- 每日翻译字数限制 1000 字符（MyMemory API 限制）
- 翻译失败时显示原文

## License

MIT
