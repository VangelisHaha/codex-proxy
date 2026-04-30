# Repository Guidelines

## Project Structure & Module Organization

本仓库是 TypeScript 为主的 Codex Proxy 服务，根目录保存核心配置与文档。`src/` 放后端服务、路由、配置、日志、TLS 传输与模型逻辑；`src/routes/shared/` 放跨路由复用的代理处理工具。`shared/` 存放前后端共享类型、hooks、i18n 与通用工具。`web/` 是 Vite + Preact 管理界面。`packages/electron/` 是桌面端 Electron 壳与打包逻辑。`native/` 是 Rust 原生 TLS 模块。测试主要在 `tests/`、`shared/**/*.test.ts`、`web/src/**/*.test.tsx` 与 `packages/electron/__tests__/`。

## Build, Test, and Development Commands

- `npm run dev`：使用 `tsx watch src/index.ts` 启动后端开发服务。
- `npm run dev:web`：进入 `web/` 启动 Vite 前端开发服务。
- `npm run build`：先构建前端，再运行 TypeScript 编译。
- `npm start`：运行 `dist/index.js`，用于验证构建产物。
- `npm test`：执行默认 Vitest 测试集。
- `npm run test:unit` / `test:integration` / `test:e2e`：按目录运行专项测试。
- `npm run test:stress`：运行压力测试配置。
- `cd packages/electron && npm run build`：构建 Electron 主进程代码。

## Coding Style & Naming Conventions

项目使用 ESM、TypeScript 5、Hono 与 Vitest。保持现有代码风格：两个空格缩进，双引号，显式导出，文件名使用 kebab-case，例如 `proxy-error-handler.ts`。React/Preact 组件使用 PascalCase，例如 `AccountList.tsx`；hooks 使用 `use-*.ts`。同类工具逻辑必须抽到公共方法，优先放在 `src/utils/`、`shared/utils/` 或相关模块的 `shared/` 子目录，避免在路由内重复实现。

## Testing Guidelines

新增行为必须补充就近测试。后端单元与集成测试放在 `tests/unit/`、`tests/integration/`、`tests/e2e/`；共享模块测试可与源码同目录，使用 `*.test.ts` 或 `*.spec.ts`。Electron 相关测试放在 `packages/electron/__tests__/`。涉及真实账号、外部服务或压力场景时，优先使用现有 `tests/_helpers/` 和 `tests/_fixtures/`，避免硬编码密钥、账号或本机路径。

## Commit & Pull Request Guidelines

提交历史采用 Conventional Commits，例如 `fix: recover from previous_response_not_found`、`feat: persist home account filters`、`chore: bump version to 2.0.67`。提交信息应说明用户可见变化或修复点，避免混入无关格式化。PR 应包含变更摘要、测试结果、关联 issue；涉及 UI 的变更需附截图或录屏；涉及配置、认证、代理或账号轮转的变更需说明兼容性与回滚方式。

## Security & Configuration Tips

配置模板位于 `.env.example`、`config/default.yaml`、`config/models.yaml` 与 `config/fingerprint.yaml`。不要提交真实 API key、Cookie、账号 token、代理凭据或本机 `local.yaml`。日志、错误响应和测试快照中出现敏感字段时，应使用已有脱敏逻辑，例如 `src/logs/redact.ts`。
