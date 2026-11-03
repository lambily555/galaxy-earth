# Python Earth Atlas · Python世界地图

从宇宙中的地球出发，用探索地图的方式学习 Python 数据分析。Windows 桌面版，中文课程，本地运行代码和保存学习记录。

![全景地球首页](docs/earth.png)

## 探索方式

首页铺满宇宙场景，不设置常驻侧栏、标题卡片或工具区。地球自动旋转，可拖动旋转、滚轮靠近。点击每日任务箭头，预览「地球 → 云层 → 亚洲 → 中国 → 省份」过场，再进入市／区对应的细分内容。过场目前是首版效果样例，最终演出方式仍待体验反馈确定。

一个省级区域对应一个学习单元。每单元分为认识知识、代码与结果、动手练习、复盘四个学习站点。学完四站，省份从灰色恢复自然色；可以取消标记或重新复习。学习标记不等于已批改或独立掌握。

计划共42个单元（36学习实操、6阶段测试）。中国的34个省级区域已接入；后8个单元的课程已准备，可通过完整路线学习，但周边地图仍待后续拓展。第一站是北京。

把鼠标移到右上角或按 **Esc** 可唤出探索菜单。**Alt+F4** 退出应用；代码区 **Ctrl+Enter** 运行，**Tab** 缩进，**Ctrl+S** 保存。停笔后自动保存，切换页面和关闭窗口前也会保存。

## 课程范围

| 单元 | 内容 |
|---|---|
| 1-7 | 变量、数字与文字、列表字典、判断、循环、函数及测试 |
| 8-14 | Pandas、CSV/Excel、筛选、排序、新增列及测试 |
| 15-21 | 类型、缺失、去重、日期、文本清洗、质量核验及测试 |
| 22-28 | 分组、条件计数、连接、防重复计算、透视与排名及测试 |
| 29-35 | 环比、累计、滚动、图表、统计概览、留存及测试 |
| 36-42 | 批量文件、流程函数、SQL衔接、社媒与游戏示例项目、交付及测试 |

每单元按约45-60分钟安排；实际进度按掌握情况调整。业务数据为明确标注的教学示例，不冒充企业真实数据。

## Windows 本地启动

已安装桌面版：运行 `打开Python世界地图.cmd` 或桌面的“Python世界地图”图标。

从源码准备：将项目放在 D 盘，使用 PowerShell 运行 `准备桌面版.ps1`。脚本下载官方 Electron、官方 Python 嵌入式运行时与依赖，素材来自下列公开来源；下载与数据默认放在项目目录。首次准备需要网络，完成后可离线学习。若运行环境已有文件，脚本不会覆盖学习记录。

```powershell
pwsh -ExecutionPolicy Bypass -File .\准备桌面版.ps1
```

## 本地数据

`data/progress.json` 保存代码、答案、笔记与进度；`backups/` 保存修改前的备份；`workspace/` 是 Python 练习工作目录。导出按钮会生成 `.py` 和答案笔记文本。版本校验阻止旧页面覆盖较新的答案。上述私人目录、浏览器配置与运行时不上传仓库。

运行按钮执行本机 Python，不是隔离沙箱，仅运行可信的练习代码。单次运行限制20秒，图表会显示在结果区。

## 视觉与地理说明

地球影像、海陆轮廓、云层使用公开素材。星空为程序生成的视觉场景，其他天体大小和距离为可看性调整，行星外观含示意纹理，不表示真实即时星位。中国地图用于学习探索，不作导航或测绘依据。市／区只是课程站点，不要求每个行政区均对应知识点。

## 素材来源

- [Three.js](https://github.com/mrdoob/three.js)，MIT；地球、云层、月球影像取自 r160 的 `examples/textures/planets`。见 `vendor/THREE-LICENSE.txt`。
- [Natural Earth](https://www.naturalearthdata.com/about/terms-of-use/)，公共领域，海陆轮廓。
- [ChinaGeoJson](https://github.com/zhChuXiao/ChinaGeoJson)，MIT，省、市、区地理数据。见 `assets/geo-license.txt`。
- [polygon-clipping](https://github.com/mfogel/polygon-clipping)，MIT，用于合并省内行政区轮廓。见 `vendor/POLYGON-CLIPPING-LICENSE.md`。
- [Tabler Icons](https://github.com/tabler/tabler-icons)，MIT，桌面图标的 planet 图形。见 `assets/TABLER-LICENSE.txt`。
- Electron、Python、Pandas 等依赖各自适用其许可证；下载的桌面运行时保留随附许可证。

## 验证

`test-earth.cjs` 使用隐藏的独立测试窗口和独立数据目录，检查地球加载、亚洲过场、34省份、学习分站、自动保存、完成上色、42课程、Python/Pandas运行、图表与错误反馈。另验证过期版本不能覆盖答案。不会弹出测试窗口打断学习，也不改动 SQL 笔记本。
