import type {
  ActionType,
  ProColumns,
  ProDescriptionsItemProps,
} from '@ant-design/pro-components';
import {
  PageContainer,
  ProDescriptions,
  ProTable,
} from '@ant-design/pro-components';
import { FormattedMessage, useIntl, useRequest } from '@umijs/max';
import {  Drawer, message } from 'antd';
import React, { useCallback, useRef, useState } from 'react';
import {departments} from '@/services/ant-design-pro/departments';
import { createProTableRequest } from '@/utils/proTableRequest';
import CreateForm from './components/CreateForm';
// import UpdateForm from './components/UpdateForm';

const TableList: React.FC = () => {
  const actionRef = useRef<ActionType | null>(null);

  const [showDetail, setShowDetail] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<API.RuleListItem>();
  const [selectedRowsState, setSelectedRows] = useState<API.RuleListItem[]>([]);

  /**
   * @en-US International configuration
   * @zh-CN 国际化配置
   * */
  const intl = useIntl();

  const [, contextHolder] = message.useMessage();


  const columns: ProColumns<API.RuleListItem>[] = [
    {
      title:'昵称',
      dataIndex: 'name',
      // 昵称字段在搜索表单中显示
    },
    {
      title: '描述',
      dataIndex: 'desc',
      valueType: 'textarea',
      hideInSearch: true, // 在搜索表单中隐藏
    },{
      title: '内容',
      dataIndex: 'content',
      valueType: 'textarea',
      hideInSearch: true, // 在搜索表单中隐藏
    },
    {
      title: (
        <FormattedMessage
          id="pages.searchTable.titleUpdatedAt"
          defaultMessage="Last scheduled time"
        />
      ),
      sorter: true,
      dataIndex: 'updatedAt',
      valueType: 'dateTime',
      hideInSearch: true, // 在搜索表单中隐藏
    },
  ];

  /**
   *  Delete node
   * @zh-CN 删除节点
   *
   * @param selectedRows
   */

  return (
    <PageContainer>
      {contextHolder}
      <ProTable<API.RuleListItem, API.PageParams>
        headerTitle={intl.formatMessage({ 
          id: 'pages.searchTable.title',
          defaultMessage: 'Enquiry form',
        })}
        actionRef={actionRef}
        rowKey="id"
        toolBarRender={() => [
          <CreateForm key="create" reload={actionRef.current?.reload} />,
        ]}
        pagination={{
          defaultPageSize: 15,
          showSizeChanger: true,
          showQuickJumper: true,
          pageSizeOptions: ['10', '15', '20', '50', '100'],
          showTotal: (total) => `共 ${total} 条`,
        }}
        request={createProTableRequest(departments)}
        columns={columns}
      />
      <Drawer
        width={600}
        open={showDetail}
        onClose={() => {
          setCurrentRow(undefined);
          setShowDetail(false);
        }}
        closable={false}
      >
        {currentRow?.name && (
          <ProDescriptions<API.RuleListItem>
            column={2}
            title={currentRow?.name}
            request={async () => ({
              data: currentRow || {},
            })}
            params={{
              id: currentRow?.name,
            }}
            columns={columns as ProDescriptionsItemProps<API.RuleListItem>[]}
          />
        )}
      </Drawer>
    </PageContainer>
  );
};

export default TableList;
