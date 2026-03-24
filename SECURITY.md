# 安全说明

本文档记录项目的安全相关信息、已发现的问题及修复记录。

## 安全修复记录

### 2024-XX-XX 安全审计

#### 已修复问题

1. **XSS 漏洞 (高风险)**
   - **位置**: `src/socket/demo.js` 第 214 行
   - **问题**: 使用 `innerHTML` 直接插入用户输入的用户名
   - **修复**: 将 `span.innerHTML = userName` 改为 `span.textContent = userName`
   - **影响**: 防止恶意脚本通过用户名字段执行

2. **硬编码测试凭证 (中风险)**
   - **位置**: `src/views/login.vue`
   - **问题**: 存在 `testAccount` 函数，包含硬编码密码 `123456`
   - **修复**: 已删除该测试后门函数
   - **影响**: 防止生产环境被未授权访问

#### 已知限制和注意事项

1. **demo.js 文件**
   - 该文件是一个 WebRTC 测试演示文件
   - 生产环境建议移除或移动到测试目录
   - 当前已修复其中的 XSS 漏洞，可以继续使用

2. **环境变量安全**
   - 开发环境配置 (`.env.development`) 包含本地 API 地址
   - 确保生产环境使用 HTTPS 和 WSS
   - 不要将生产环境密钥提交到代码仓库

## 安全最佳实践

### 开发时注意事项

1. **防止 XSS 攻击**
   ```javascript
   // ❌ 危险：直接使用 innerHTML
   element.innerHTML = userInput;

   // ✅ 安全：使用 textContent
   element.textContent = userInput;

   // ✅ 安全：Vue 模板中的转义
   <div>{{ userInput }}</div>
   ```

2. **避免硬编码凭证**
   ```javascript
   // ❌ 危险：硬编码密码
   const password = '123456';

   // ✅ 安全：从环境变量或配置获取
   const apiUrl = import.meta.env.VITE_APP_API_BASEURL;
   ```

3. **WebSocket 连接安全**
   - 开发环境：`ws://` (仅本地)
   - 生产环境：`wss://` (必须)

4. **文件上传安全**
   - 已配置常见文件类型白名单
   - 生产环境建议添加：
     - 文件大小限制
     - 病毒扫描
     - 文件名清理

### 部署前检查清单

- [ ] 生产环境 API 地址已配置
- [ ] WebSocket 使用 WSS 协议
- [ ] 调试工具已禁用 (`VITE_APP_DEBUG_TOOL` 为空)
- [ ] Source map 已禁用 (`VITE_BUILD_SOURCEMAP=false`)
- [ ] Mock 数据已禁用 (`VITE_BUILD_MOCK=false`)
- [ ] 所有测试后门代码已移除
- [ ] 敏感信息未提交到仓库

## 报告安全问题

如果你发现了安全漏洞，请：

1. **不要** 在公开 Issue 中披露
2. 发送邮件给项目维护者
3. 等待修复后再公开讨论

## 相关资源

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Vue.js 安全指南](https://vuejs.org/guide/best-practices/security.html)
- [WebRTC 安全](https://webrtc.org/getting-started/security)
