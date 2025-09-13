import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  apiKey?: string;
  debug?: boolean;
}

export class HttpClient {
  private client: AxiosInstance;
  private debug: boolean;

  constructor(config: HttpClientConfig) {
    this.debug = config.debug || false;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        "Content-Type": "application/json",
        ...(config.apiKey && { Authorization: `Bearer ${config.apiKey}` }),
      },
    });

    // Request Interceptor
    this.client.interceptors.request.use((config: any) => {
      if (this.debug) {
        console.log(`[REQ] [${config.method?.toUpperCase()}] ${config.url}`, {
          headers: config.headers,
          data: config.data,
        });
      }
      return config;
    });

    // Response Interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        if (this.debug) {
          console.log(
            `[RES] [${response.config.method?.toUpperCase()}] ${response.config.url}`,
            {
              status: response.status,
              response: response.data,
            },
          );
        }
        return response.data;
      },
      (error: any) => {
        if (error.response) {
          if (this.debug) {
            console.error(
              `[RES] [${error.response.config.method?.toUpperCase()}] ${error.response.config.url}`,
              {
                status: error.response.status,
                response: error.response.data,
              },
            );
          }
        } else {
          if (this.debug) {
            console.error(`[RES] Network Error`, error.message);
          }
        }

        if (error?.response?.data) {
          return Promise.reject(error?.response?.data);
        }
        return Promise.reject({ message: error.message });
      },
    );
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.client.put(url, data, config);
  }

  async patch<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }

  // Update the authorization token
  setAuthToken(token: string): void {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  // Remove the authorization token
  removeAuthToken(): void {
    delete this.client.defaults.headers.common["Authorization"];
  }
}
