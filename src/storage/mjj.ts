/**
 * 上传图片到 mjj.today (Chevereto API v1)
 */
export async function uploadToMjj(
  apiKey: string,
  fileBlob: Blob,
  filename: string
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append("key", apiKey);
    formData.append("source", fileBlob, filename);
    formData.append("format", "json");

    const response = await fetch("https://mjj.today/api/1/upload", {
      method: "POST",
      body: formData,
      headers: {
        "User-Agent": "MailProbe-Worker/1.0"
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `mjj.today 响应异常 (${response.status}): ${errorText.substring(0, 200)}`
      };
    }

    const data = (await response.json()) as any;

    if (data.status_code === 200 && data.image?.url) {
      return {
        success: true,
        url: data.image.url
      };
    }

    const errMsg = data.error?.message || "上传至 mjj.today 失败，未返回图片直链";
    return { success: false, error: errMsg };
  } catch (err: any) {
    return { success: false, error: `请求 mjj.today 发生网络错误: ${err?.message || String(err)}` };
  }
}
