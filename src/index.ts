import type {AxiosInstance, AxiosRequestConfig, AxiosStatic} from 'axios';
import {HttpCookieAgent, HttpsCookieAgent} from 'http-cookie-agent/http';
import type {CookieJar} from 'tough-cookie';

declare module 'axios' {
    interface AxiosRequestConfig {
        jar?: CookieJar;
    }
}

function requestInterceptor(config: AxiosRequestConfig): AxiosRequestConfig {
    if (!config.jar) {
        return config;
    }

    // @ts-expect-error ...
    if (config.jar === true) {
        throw new Error('config.jar does not accept boolean since axios-cookiejar-support@2.0.0.');
    }

    config.httpAgent = config.httpAgent || new HttpCookieAgent({cookies: {jar: config.jar}});
    config.httpsAgent = config.httpsAgent || new HttpsCookieAgent({cookies: {jar: config.jar}});

    return config;
}

export function wrapper<T extends AxiosStatic | AxiosInstance>(axios: T): T {
    const isWrapped = axios.interceptors.request.handlers.find(({fulfilled}) => fulfilled === requestInterceptor);

    if (isWrapped) {
        return axios;
    }

    axios.interceptors.request.use(requestInterceptor);

    if ('create' in axios) {
        const create = axios.create;
        axios.create = (...args) => {
            const instance = create.apply(axios, args);
            instance.interceptors.request.use(requestInterceptor);
            return instance;
        };
    }

    return axios;
}
