# TypeScript + React + Vite 开发规范

## 1. 技术栈 & 版本

- 核心框架: React 18+ (使用 Hooks 和 Functional Components，禁止 Class 组件)
- 语言: TypeScript 5+ (严格模式，禁止滥用 any)
- 构建工具: Vite 5+ (使用 ESM 导入)

## 2. 代码风格 & 命名约定

- 组件命名: 采用大驼峰命名法 (PascalCase)，如 `ButtonContainer.tsx`
- 组件导出: 优先使用具名导出 (Named Exports) 而非默认导出 (Default Export)
- 钩子命名: 自定义 Hooks 必须以 `use` 开头，采用小驼峰 (camelCase)
- 文件路径: 必须使用 Vite 配置的路径别名（如 `@/components/...`），禁止使用多层级相对路径 `../../`

## 3. TypeScript 最佳实践

- 优先使用 `interface` 定义对象类型，使用 `type` 定义联合类型
- React 组件的 Props 必须显式定义类型：
  ```typescript
  interface ButtonProps {
    label: string;
    onClick: () => void;
  }
  export const Button: React.FC<ButtonProps> = ({ label, onClick }) => { ... }
  ```
- 严格处理空值，使用可选链 `?.` 和空值合并运算符 `??`

## 4. 禁止 AI 修改的文件
