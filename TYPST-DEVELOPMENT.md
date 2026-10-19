# Typst 开发说明

基于 tau-plugin-template 生成后独立演进。正式发布须使用公开 npm 依赖并完成真实包验证。

排版在渲染进程本地完成：`src/compiler/engine.ts` 用 typst.ts 0.6.1-rc3 的 WebAssembly 编译器产出 vector 产物，再由渲染器导出自包含 SVG。wasm 与默认字体不随插件包分发，首次编译时由 `src/compiler/resources.ts` 从 jsdelivr/unpkg 双源下载（大小与 sha256 校验）并缓存在 IndexedDB，此后离线可用。编译在主线程同步执行，配合 TypstPreview 的 200ms 防抖；wasm 不可中断，AbortSignal 只在编译开始前生效。

TypstBlock 直接使用本地引擎，不再依赖 usePluginServices 或宿主编译服务；预览挂载不写节点，仅用户编辑源码后的匹配编译结果保存缓存。`html` 字段自 0.2.0 起保存 SVG 字符串，历史 HTML 缓存照常展示；博客端经 htmlSerializers 消费缓存，SVG 会去掉交互脚本并注入 `max-width:100%;height:auto`，过期缓存回退源码。

`type: typst`、`content/html/compiledFrom/compiledAt/children` 延续既有数据，Markdown 只序列化源码。

运行 `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm build`。产物 ZIP 只包含插件代码；不要把 wasm 或字体复制进插件。升级 typst.ts 版本时须同步更新 `src/compiler/resources.ts` 里的文件大小与 sha256 清单，并回归首下载、断网重试与旧缓存文档三条路径。
