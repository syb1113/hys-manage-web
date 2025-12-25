import { InboxOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { Upload, Modal, message, UploadProps, Button } from 'antd';
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
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | undefined>(value);

  // 当外部 value 变化时更新内部状态
  React.useEffect(() => {
    setImageUrl(value);
  }, [value]);

  const handleUpload: UploadProps['customRequest'] = async (options) => {
    const { file, onSuccess: onUploadSuccess, onError } = options;
    const uploadFile = file as File;

    setUploading(true);

    try {
      const response = await uploadApi(uploadFile);

      if (response.success && response.data?.url) {
        const url = response.data.url;
        
        setImageUrl(url);
        setFileList([]);
        setModalVisible(false);
        
        message.success('上传成功');
        onChange?.(url);
        onSuccess?.(url);
        onUploadSuccess?.(response, uploadFile as any);
      } else {
        throw new Error(response.errorMessage || '上传失败');
      }
    } catch (error: any) {
      const errorMessage = error?.errorMessage || error?.message || '上传失败，请重试';
      message.error(errorMessage);
      onError?.(error as Error);
    } finally {
      setUploading(false);
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
      setFileList(info.fileList);
    },
    onRemove: () => {
      setFileList([]);
    },
    showUploadList: false,
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {showPreview && imageUrl && (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <img
              src={imageUrl}
              alt="预览"
              style={{
                width: 104,
                height: 104,
                objectFit: 'cover',
                borderRadius: 4,
                border: '1px solid #d9d9d9',
              }}
            />
            {!disabled && (
              <span
                onClick={handleRemove}
                style={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  cursor: 'pointer',
                  fontSize: 20,
                  color: '#ff4d4f',
                  background: '#fff',
                  borderRadius: '50%',
                  width: 24,
                  height: 24,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                ×
              </span>
            )}
          </div>
        )}
        
        <Button
          icon={uploading ? <LoadingOutlined /> : <PlusOutlined />}
          disabled={disabled}
          onClick={() => setModalVisible(true)}
        >
          {buttonText}
        </Button>
      </div>

      <Modal
        title="上传图片"
        open={modalVisible}
        onCancel={() => {
          if (!uploading) {
            setModalVisible(false);
            setFileList([]);
          }
        }}
        footer={null}
        width={520}
        maskClosable={!uploading}
        closable={!uploading}
      >
        <Dragger {...uploadProps} disabled={uploading}>
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
        
        {fileList.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
              待上传文件：
            </div>
            {fileList.map((file) => (
              <div
                key={file.uid}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 4,
                  marginBottom: 8,
                }}
              >
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {file.name}
                </span>
                {uploading && (
                  <LoadingOutlined style={{ marginLeft: 8, color: '#1890ff' }} />
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
};

export default ImageUpload;
