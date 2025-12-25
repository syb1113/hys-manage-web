import { request } from '@umijs/max';
/** 获取科室 GET /api/rule */
export async function departments(
    params: {
        // query
        /** 名称 */
        name?: string;
        /** 当前的页码 */
        per?: number;
        /** 页面的容量 */
        page?: number;
    }
) {
    return request<API.RuleList>('/admin/departments', {
        method: 'GET',
        params: {
            ...params,
        },
    });
}

export async function addDepartment( data: API.DepartmentAdd ) {
    return request<API.DepartmentAdd>(`/admin/departments`, {
        method: 'post',
        data: data
    });
}