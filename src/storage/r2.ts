/**
 * 上传图片到 Cloudflare R2 存储桶
 */
export async function uploadToR2(
  r2: R2Bucket,
  key: string,
  arrayBuffer: ArrayBuffer,
  contentType: string
): Promise<{ success: boolean; key?: string; error?: string }> {
  try {
    await r2.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: contentType || "image/png"
      }
    });

    return {
      success: true,
      key
    };
  } catch (err: any) {
    return {
      success: false,
      error: `保存至 R2 失败: ${err?.message || String(err)}`
    };
  }
}
