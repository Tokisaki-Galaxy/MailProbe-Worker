import { styles } from "./styles";
import { renderBody } from "./template";
import { scripts } from "./scripts";

export function renderHtml(appTitle: string, adminPrefix: string = "/admin"): string {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${appTitle}</title>
  <script>
    window.__ADMIN_PREFIX__ = "${adminPrefix}";
  </script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
${styles}
  </style>
</head>
<body>
${renderBody(appTitle)}
  <script>
${scripts}
  </script>
</body>
</html>`;
}
