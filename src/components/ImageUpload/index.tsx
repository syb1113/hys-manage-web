import { InboxOutlined, LoadingOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { Upload, Modal, message, UploadProps, Image, Button } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React, { useState } from 'react';
import { uploadApi } from '@/services/ant-design-pro/common';

const { Dragger } = Upload;

export interface ImageUploadProps {
  /** 上传成功后的回调，返回图片 URL */
  onSuccess?: (url: string) => void;
  /** 限制文件大小（单位：MB），默认 5MB */
  maxSize?: number;
  /** 限制文件类型，默认为 'image/png,image/jpeg,image/jpg,image/svg+xml' */
  accept?: string;
  /** 允许的文件扩展名，默认 ['png', 'jpeg', 'jpg', 'svg'] */
  allowedExtensions?: string[];
  /** 是否显示预览图 */
  showPreview?: boolean;
  /** 自定义上传按钮文本 */
  buttonText?: string;
  /** 初始图片 URL */
  value?: string;
  /** 值改变时的回调 */
  onChange?: (url: string) => void;
  /** 是否禁用 */
  disabled?: boolean;
}

/**
 * 图片上传组件
 * 点击按钮打开弹窗，支持拖拽和点击上传
 */
const ImageUpload: React.FC<ImageUploadProps> = ({
  onSuccess,
  maxSize = 5,
  accept = 'image/png,image/jpeg,image/jpg,image/svg+xml',
  allowedExtensions = ['png', 'jpeg', 'jpg', 'svg'],
  showPreview = true,
  buttonText = '上传图片',
  value,
  onChange,
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [imageUrl, setImageUrl] = useState<string | undefined>(value);

  // 当外部 value 变化时更新内部状态
  React.useEffect(() => {
    setImageUrl(value);
  }, [value]);

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess: onUploadSuccess, onError, onProgress } = options;
    const uploadFile = file as File;

    try {
      // 模拟上传进度
      onProgress?.({ percent: 0 } as any);
      
      const response = await uploadApi(uploadFile);
      console.log("🚀 ~ handleUpload ~ response: ", response);

      if (response.success && response.data) {
        const url = API_URL + response.data;
        console.log("🚀 ~ handleUpload ~ url: ", url);
        
        // 完成进度
        onProgress?.({ percent: 100 } as any);
        
        // 调用成功回调，传入包含 URL 的响应
        // 响应对象会被 Upload 组件传递到 onChange 中，我们可以从中获取 url
        const responseWithUrl = {
          ...response,
          url: url,
        };
        onUploadSuccess?.(responseWithUrl as any, uploadFile as any);
      } else {
        console.log('else  上传失败')
        throw new Error(response.errorMessage || '上传失败');
      }
    } catch (error: any) {
      const errorMessage = error?.errorMessage || error?.message || '上传失败，请重试';
      message.error(errorMessage);
      console.log('catch error  上传失败')
      
      // 调用错误回调，文件状态会在 onChange 中自动更新为 error
      onError?.(error as Error);
    }
  };

  // 确认按钮处理
  const handleConfirm = () => {
    // 从 fileList 中获取已上传成功的文件 URL
    const uploadedFile = fileList.find(file => file.status === 'done' && file.url);
    if (uploadedFile?.url) {
      setImageUrl(uploadedFile.url);
      onChange?.(uploadedFile.url);
      onSuccess?.(uploadedFile.url);
      setFileList([]);
      setModalVisible(false);
    }
  };

  // 取消按钮处理
  const handleCancel = () => {
    const isUploading = fileList.some(file => file.status === 'uploading');
    if (!isUploading) {
      setFileList([]);
      setModalVisible(false);
    }
  };

  const handleRemove = () => {
    setImageUrl(undefined);
    onChange?.('');
    onSuccess?.('');
  };

  // 验证文件类型
  const validateFileType = (file: File): boolean => {
    // 获取文件扩展名
    const fileName = file.name.toLowerCase();
    const lastDotIndex = fileName.lastIndexOf('.');
    
    if (lastDotIndex === -1) {
      message.error(`只支持上传 ${allowedExtensions.join(', ').toUpperCase()} 格式的图片`);
      return false;
    }
    
    const fileExtension = fileName.substring(lastDotIndex + 1);
    
    // 检查扩展名是否在允许列表中
    const isValidExtension = allowedExtensions.some(
      (ext) => ext.toLowerCase() === fileExtension
    );
    
    if (!isValidExtension) {
      message.error(`只支持上传 ${allowedExtensions.join(', ').toUpperCase()} 格式的图片`);
      return false;
    }
    
    // MIME 类型映射
    const mimeTypeMap: Record<string, string[]> = {
      png: ['image/png'],
      jpeg: ['image/jpeg', 'image/jpg'],
      jpg: ['image/jpeg', 'image/jpg'],
      svg: ['image/svg+xml'],
    };
    
    // 如果提供了 MIME 类型，则验证 MIME 类型
    if (file.type) {
      const allowedMimeTypes = mimeTypeMap[fileExtension] || [];
      const isValidMimeType = allowedMimeTypes.some((mime) => file.type === mime);
      
      if (!isValidMimeType) {
        message.error(`只支持上传 ${allowedExtensions.join(', ').toUpperCase()} 格式的图片`);
        return false;
      }
    }
    
    return true;
  };

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept,
    fileList,
    customRequest: handleUpload,
    beforeUpload: (file) => {
      // 检查文件大小
      const isValidSize = file.size / 1024 / 1024 < maxSize;
      if (!isValidSize) {
        message.error(`图片大小不能超过 ${maxSize}MB`);
        return Upload.LIST_IGNORE;
      }

      // 检查文件类型
      if (!validateFileType(file)) {
        return Upload.LIST_IGNORE;
      }

      return true;
    },
    onChange: (info) => {
      // 更新文件列表
      // Upload 组件会自动更新文件状态，我们需要确保 URL 被正确设置
      const updatedFileList = info.fileList.map((file) => {
        // 如果文件上传成功，从 response 中获取 URL
        if (file.status === 'done' && file.response?.url) {
          return {
            ...file,
            url: file.response.url,
          };
        }
        return file;
      });
      setFileList(updatedFileList);
    },
    onRemove: () => {
      setFileList([]);
    }
  };

  // 如果有图片，显示图片预览；否则显示上传按钮
  const uploadButton = (
    <div
      onClick={() => !disabled && setModalVisible(true)}
      style={{
        width: 104,
        height: 104,
        border: '1px dashed #d9d9d9',
        borderRadius: 4,
        backgroundColor: '#fafafa',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'border-color 0.3s',
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.borderColor = '#1890ff';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#d9d9d9';
      }}
    >
      <PlusOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
      <div style={{ marginTop: 8, color: '#8c8c8c', fontSize: 14 }}>
        {buttonText}
      </div>
    </div>
  );

  return (
    <>
      <div style={{ display: 'inline-block' }}>
        {imageUrl && showPreview ? (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Image
              src={imageUrl}
              alt="预览"
              width={104}
              height={104}
              preview={{
                mask: null,
              }}
              style={{
                borderRadius: 4,
                border: '1px solid #d9d9d9',
                objectFit: 'cover',
              }}
            />
            {!disabled && (
              <>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setModalVisible(true);
                  }}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    cursor: 'pointer',
                    background: 'rgba(0, 0, 0, 0.5)',
                    color: '#fff',
                    fontSize: 12,
                    padding: '4px',
                    textAlign: 'center',
                    borderBottomLeftRadius: 4,
                    borderBottomRightRadius: 4,
                  }}
                >
                  重新上传
                </div>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove();
                  }}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    cursor: 'pointer',
                    width: 22,
                    height: 22,
                    background: '#ff4d4f',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    color: '#fff',
                    fontSize: 14,
                  }}
                >
                  <DeleteOutlined />
                </div>
              </>
            )}
          </div>
        ) : (
          uploadButton
        )}
      </div>

      <Modal
        title="上传图片"
        open={modalVisible}
        onCancel={handleCancel}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={handleCancel} disabled={fileList.some(file => file.status === 'uploading')}>
              取消
            </Button>
            <Button
              type="primary"
              onClick={handleConfirm}
              disabled={!fileList.some(file => file.status === 'done') || fileList.some(file => file.status === 'uploading')}
            >
              确认
            </Button>
          </div>
        }
        width={520}
        maskClosable={!fileList.some(file => file.status === 'uploading')}
        closable={!fileList.some(file => file.status === 'uploading')}
      >
        <Dragger {...uploadProps} disabled={fileList.some(file => file.status === 'uploading')}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined style={{ fontSize: 48, color: '#1890ff' }} />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
          <p className="ant-upload-hint">
            支持单个图片上传，文件大小不超过 {maxSize}MB
            <br />
            支持格式：{allowedExtensions.map(ext => ext.toUpperCase()).join('、')}
          </p>
        </Dragger>
        
        {/* {uploadedUrl && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
              上传成功，预览：
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px',
                backgroundColor: '#f5f5f5',
                borderRadius: 4,
                border: '1px solid #d9d9d9',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                <Image
                  src={uploadedUrl}
                  alt="预览"
                  width={60}
                  height={60}
                  style={{
                    borderRadius: 4,
                    objectFit: 'cover',
                  }}
                  preview={false}
                />
                <div style={{ marginLeft: 12, flex: 1 }}>
                  <div style={{ fontSize: 14, color: '#333', marginBottom: 4 }}>
                    图片上传成功
                  </div>
                </div>
              </div>
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                onClick={handleRemoveUploadedFile}
                disabled={uploading}
              >
                删除
              </Button>
            </div>
          </div>
        )} */}
      </Modal>
    </>
  );
};

export default ImageUpload;
