# 单页导航

文件：

- `index.html`：单页应用。
- `nav-items.json`：导航数据，首页启动时读取它。
- 收藏状态：只保存在每个用户浏览器的 `localStorage`，不会写入 `nav-items.json`。

离线说明：

- 不依赖任何第三方 CSS 或 JS。
- 不加载 CDN、字体、图片或远程资源。
- 左上角图标和浏览器页签图标都由本地配置文字生成。

全局配置：

- `app.pageTitle`：浏览器 HTML title。
- `app.brandTitle`：左上角显示标题。
- `app.icon`：左上角方块图标文字，同时用于生成本地 favicon。
- 旧版纯数组格式仍可读取，保存后会变成 `{ "app": ..., "items": [...] }` 格式。

排序规则：

- 首页先显示当前用户收藏的项目。
- 收藏组内和非收藏组内都按 `order` 从小到大排序。
- `order` 相同时按 `createdAt` 从早到晚排序。
- 配置页和保存后的 JSON 不受本地收藏影响，只按 `order` 和 `createdAt` 排序。

链接规则：

- `baidu.com` 会打开 `https://baidu.com`
- `https://example.com` 会按原样打开
- `hostname:3456` 会把 `hostname` 替换成当前访问页面的主机名或 IP
- `{{host}}:3456` 和 `{{hostname}}:3456` 也支持

## nginx 保存配置

浏览器不能直接把文件写回服务器。配置页面保存时会先尝试 `PUT /nav-items.json`，所以 nginx 需要允许这个文件被 PUT 写入，并且 nginx 运行用户要有目录写权限。

示例：

```nginx
server {
    listen 80;
    server_name _;

    root /var/www/nav;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /nav-items.json {
        default_type application/json;
        dav_methods PUT;
        dav_access user:rw group:rw all:r;
        limit_except GET PUT {
            deny all;
        }
    }
}
```

如果没有开启 nginx 的 PUT 写入，页面会自动下载新的 `nav-items.json`，再手动放回 `index.html` 同目录即可。
