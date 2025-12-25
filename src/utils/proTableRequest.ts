/**
 * ProTable 请求数据格式化工具
 * 用于统一处理 API 响应数据格式转换为 ProTable 需要的格式
 */

/**
 * API 响应数据结构
 */
interface ApiResponse<T = any> {
  success?: boolean;
  data?: {
    list?: T[];
    total?: number;
    [key: string]: any;
  };
  errorMessage?: string;
  [key: string]: any;
}

/**
 * ProTable 请求参数
 */
interface ProTableParams {
  current?: number;
  pageSize?: number;
  [key: string]: any;
}

/**
 * ProTable 请求返回格式
 */
interface ProTableResponse<T = any> {
  data: T[];
  success: boolean;
  total: number;
}

/**
 * API 函数类型定义
 */
type ApiFunction<TParams = any, TResponse = ApiResponse> = (
  params: TParams,
) => Promise<TResponse>;

/**
 * ProTable 请求函数类型定义
 */
export type ProTableRequestFunction<T = any> = (
  params: ProTableParams,
  sort?: Record<string, 'ascend' | 'descend' | null>,
  filter?: Record<string, (string | number)[] | null>,
) => Promise<ProTableResponse<T>>;

/**
 * 参数转换配置
 */
interface ParamTransformConfig {
  /** 将 current 转换为的字段名，默认为 'page' */
  currentTo?: string;
  /** 将 pageSize 转换为的字段名，默认为 'per' */
  pageSizeTo?: string;
  /** 是否启用参数转换，默认为 true */
  transformParams?: boolean;
}

/**
 * 响应数据转换配置
 */
interface ResponseTransformConfig {
  /** 数据列表字段路径，默认为 'data.list' */
  dataPath?: string;
  /** 总数字段路径，默认为 'data.total' */
  totalPath?: string;
}

/**
 * 创建 ProTable 请求函数的配置选项
 */
interface CreateProTableRequestOptions {
  /** 参数转换配置 */
  paramTransform?: ParamTransformConfig;
  /** 响应数据转换配置 */
  responseTransform?: ResponseTransformConfig;
  /** 自定义参数转换函数 */
  transformParams?: (params: ProTableParams) => any;
  /** 自定义响应数据转换函数 */
  transformResponse?: (response: ApiResponse) => ProTableResponse;
}

/**
 * 默认配置
 */
const defaultOptions: Required<CreateProTableRequestOptions> = {
  paramTransform: {
    currentTo: 'page',
    pageSizeTo: 'per',
    transformParams: true,
  },
  responseTransform: {
    dataPath: 'data.list',
    totalPath: 'data.total',
  },
  transformParams: undefined as any,
  transformResponse: undefined as any,
};

/**
 * 根据路径获取嵌套对象的值
 */
function getValueByPath(obj: any, path: string): any {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value == null || typeof value !== 'object') {
      return undefined;
    }
    value = value[key];
  }
  return value;
}

/**
 * 创建 ProTable 请求函数
 *
 * @param apiFunction - API 调用函数
 * @param options - 配置选项
 * @returns ProTable 请求函数
 *
 * @example
 * ```tsx
 * // 基本使用
 * const request = createProTableRequest(departments);
 *
 * // 在 ProTable 中使用
 * <ProTable
 *   request={request}
 *   ...
 * />
 *
 * // 自定义配置
 * const request = createProTableRequest(departments, {
 *   paramTransform: {
 *     currentTo: 'pageNum',
 *     pageSizeTo: 'pageSize',
 *   },
 *   responseTransform: {
 *     dataPath: 'data.items',
 *     totalPath: 'data.count',
 *   },
 * });
 * ```
 */
export function createProTableRequest<T = any>(
  apiFunction: ApiFunction,
  options: CreateProTableRequestOptions = {},
): ProTableRequestFunction<T> {
  const config = {
    ...defaultOptions,
    ...options,
    paramTransform: {
      ...defaultOptions.paramTransform,
      ...(options.paramTransform || {}),
    },
    responseTransform: {
      ...defaultOptions.responseTransform,
      ...(options.responseTransform || {}),
    },
  };

  return async (
    params: ProTableParams,
    sort?: Record<string, 'ascend' | 'descend' | null>,
    filter?: Record<string, (string | number)[] | null>,
  ): Promise<ProTableResponse<T>> => {
    try {
      // 参数转换
      let apiParams: any;
      if (config.transformParams) {
        // 使用自定义参数转换函数
        apiParams = config.transformParams(params);
      } else if (config.paramTransform?.transformParams !== false) {
        // 使用默认参数转换
        const { current, pageSize, ...restParams } = params;
        apiParams = {
          ...restParams,
          [config.paramTransform.currentTo || 'page']: current,
          [config.paramTransform.pageSizeTo || 'per']: pageSize,
        };
      } else {
        // 不转换参数
        apiParams = params;
      }

      // 调用 API
      const response = (await apiFunction(apiParams)) as ApiResponse<T>;

      // 响应数据转换
      if (config.transformResponse) {
        // 使用自定义响应转换函数
        return config.transformResponse(response);
      } else {
        // 使用默认响应转换
        const responseData = response.data as any;
        const data = getValueByPath(response, config.responseTransform.dataPath || 'data.list') || [];
        const total = getValueByPath(response, config.responseTransform.totalPath || 'data.total') || 0;

        return {
          data: Array.isArray(data) ? data : [],
          success: response.success ?? true,
          total: typeof total === 'number' ? total : 0,
        };
      }
    } catch (error) {
      console.error('ProTable request error:', error);
      return {
        data: [],
        success: false,
        total: 0,
      };
    }
  };
}

/**
 * 默认的 ProTable 请求函数（使用默认配置）
 * 适用于标准的后端响应格式：{ success: boolean, data: { list: [], total: number } }
 *
 * @param apiFunction - API 调用函数
 * @returns ProTable 请求函数
 */
export function defaultProTableRequest<T = any>(
  apiFunction: ApiFunction,
): ProTableRequestFunction<T> {
  return createProTableRequest<T>(apiFunction);
}
