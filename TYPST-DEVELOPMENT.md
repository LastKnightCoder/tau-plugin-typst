# Typst 开发说明

基于 tau-plugin-template 的 main 提交 `1d22a881833467c7fada43fbbbd0cdf0fdb04ad5`，使用 SDK 0.16.0。迁移来源为 editor 的 `fb887ea9bfe34397d4ce3fe7ce524478e6ad90c0`。正式发布须使用公开 npm 依赖并完成真实包验证。

TypstBlock 经 usePluginServices 获取可选宿主服务，适配成函数交给 TypstPreview。服务作用域属于插件宿主，不属于 useSourceBlock 或 EditorKit；组件按源码变化和卸载取消请求。博客没有服务，只展示缓存或源码。预览挂载不写节点；仅用户编辑源码后的匹配编译结果保存缓存。

`type: typst`、`content/html/compiledFrom/compiledAt/children` 延续既有数据，Markdown 只序列化源码。没有 compiledFrom 的历史缓存可以展示，已标记源码且不匹配的缓存不用于博客与静态导出。

运行 `pnpm install --frozen-lockfile`、`pnpm test`、`pnpm build`。产物 `dist/tau.typst-0.1.0.zip` 只包含插件代码，不含原生编译器、WASM 或字体；不要把客户端原生依赖复制进插件。
