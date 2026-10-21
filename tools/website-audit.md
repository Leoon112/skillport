---
id: website-audit
name: Website Audit
description: 检查网站上线前漏洞、运行时错误与产品质量
version: 1.0.0
category: security
tags: [security, audit, ci]
aliases: [site-audit, web-check]
installed: true
path: tools/scripts/website-audit.js
deps: [node>=18]
trust: declared
command: node tools/scripts/website-audit.js
args: [--format, json]
inputs:
  - name: url
    type: string
    description: 要审计的网址
    required: true
  - name: depth
    type: number
    description: 爬取深度
permissions: [network, file-read]
---

# Website Audit

检查网站上线前的安全漏洞、运行时错误与产品质量。

## 用法

AI 层可依据 frontmatter 的 `command` / `inputs` / `permissions` 字段自动调用本工具（当前为占位脚本，真实逻辑待实现）。

## 权限

需要网络访问；可能启动无头浏览器抓取页面。
