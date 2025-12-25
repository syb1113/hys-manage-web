import { request } from '@umijs/max';

/**
 * 上传文件接口
 * @param file 文件对象
 * @param options 可选配置
 */
export async function uploadApi(file: File, options?: { [key: string]: any }) {
  const formData = new FormData();
  formData.append('file', file);
  
  return request<{
    success?: boolean;
    data?:string;
    errorMessage?: string;
  }>('/common/upload', {
    method: 'POST',
    data: formData,
    requestType: 'form',
    ...(options || {}),
  });
}