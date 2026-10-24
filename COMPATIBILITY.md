# 兼容性与开发验证

使用 SDK 0.42.0与 UI 0.4.0。SDK 已发布到 npm，使用仓库内的正式 npm 依赖与锁文件，执行 pnpm install --frozen-lockfile、构建和测试，无需注入本地 SDK。

## 平台边界

同一个作者清单声明 desktop、android、ios，构建生成同一份格式 3 ZIP。插件 ID、节点类型与数据保持不变。Typst 使用插件内 WebAssembly 引擎，异步初始化大体积 Wasm；首次引擎与字体下载、取消和缓存分别验证。

环境只提供 platform 和 input.coarsePointer/finePointer，不包含布局或能力列表。功能直接通过统一 API 注册，不另列能力需求；用户权限和文档只读状态仍独立判断。

纯 Markdown Skill 由构建器打包，桌面消费、移动只保存。正文和博客使用同一份节点定义，不依赖应用 activate。

## 验证与发行

仓库外构建与测试不代表设备验收。Android/iOS 分别验证下载安装、插入、编辑、保存、取消和重启恢复；平板、最低系统、真机输入与手感仍单独验收。只有明确授权发行时才发布 npm 或推送发布标签；普通源码提交不等于插件已上架。
