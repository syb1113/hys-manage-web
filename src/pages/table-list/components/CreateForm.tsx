import { PlusOutlined } from '@ant-design/icons';
import {
  type ActionType,
  ModalForm,
  ProFormText,
  ProFormTextArea,
  ProFormItem,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useRequest } from '@umijs/max';
import { Button, message } from 'antd';
import type { FC } from 'react';
import { addDepartment } from '@/services/ant-design-pro/departments';
import { ImageUpload } from '@/components';

interface CreateFormProps {
  reload?: ActionType['reload'];
}

const CreateForm: FC<CreateFormProps> = (props) => {
  const { reload } = props;

  const [messageApi, contextHolder] = message.useMessage();

  const { run, loading } = useRequest(addDepartment, {
    manual: true,
    onSuccess: () => {
      messageApi.success('Added successfully');
      reload?.();
    },
    onError: () => {
      messageApi.error('Adding failed, please try again!');
    },
  });

  return (
    <>
      {contextHolder}
      <ModalForm
        title='新建科室'
        trigger={
          <Button type="primary" icon={<PlusOutlined />}>
            <FormattedMessage id="pages.searchTable.new" defaultMessage="New" />
          </Button>
        }
        width="600px"
        modalProps={{ okButtonProps: { loading } }}
        onFinish={async (value) => {
          await run( value as API.DepartmentAdd );

          return true;
        }}
      >
        <ProFormText
          label='科室昵称'
          rules={[
            {
              required: true,
              message: (
                <FormattedMessage
                  id="pages.searchTable.DepartmentName"
                  defaultMessage="Rule name is required"
                />
              ),
            },
          ]}
          name="name"
        />
        <ProFormTextArea label='科室描述' name="desc" />
        <ProFormTextArea label='科室详情' name="content" />
        <ProFormItem label="科室图片" name="image">
          <ImageUpload
            buttonText="上传科室图片"
            maxSize={5}
          />
        </ProFormItem>
      </ModalForm>
    </>
  );
};

export default CreateForm;
