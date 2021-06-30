/**
 * fetch-hook.js
 * @authors shenchunqian
 * @date 2021-06-29
*/

// interceptors = {
//     requestInterceptors: {
//         itc1: function(req) {
//             ....do something
//             return req
//         },
//         itc2: function(req) {
//             ....do something
//             return req
//         },
//     },
//     responseInterceptors: {
//         itc3: function(input, interceptorRes) {
//             ....do something
//             return interceptorRes
//         },
//         itc4: function(input, interceptorRes) {
//             ....do something
//             return interceptorRes
//         },
//     }
// }

// Save original fetch as _rfetch
var realFetch = "_rfetch";

export function hookFetch(interceptors, realWindow = window) {
    
    // Avoid double fetch hook
    realWindow[realFetch] = realWindow[realFetch] || realWindow.fetch;

    //定义用来存储拦截请求和拦截响应结果的处理函数集合
    let interceptors_req = [],
        interceptors_res = [];

    let interceptor_req = {};

    function c_fetch(input, init = {}) {
        //fetch默认请求方式设为GET
        if (!init.method) {
            init.method = "GET";
        }

        interceptor_req.input = input
        interceptor_req.init = init

        //interceptors_req是拦截请求的拦截处理函数集合
        if (interceptors_req.length) {
            interceptor_req = interceptors_req.reduce((interceptor_req, interceptor) => {
                return c_fetch.interceptors.interceptors.requestInterceptors[
                    interceptor
                ](interceptor_req);
            }, interceptor_req);
        }

        return new Promise(function (resolve, reject) {
            realWindow[realFetch](interceptor_req.input, interceptor_req.init)
                .then((res) => {
                    // 分流
                    const [progressStream, returnStream] = res.body.tee();
                    // 生成需要返回的res
                    const origRes = new Response(returnStream, {
                        headers: res.headers,
                        status: res.status,
                        statusText: res.statusText
                    });

                    const interceptedRes = new Response(progressStream, {
                        headers: res.headers
                    });

                    async function getResolvedRes(res) {
                        let result = await res.json();
                        return result;
                    }

                    async function runInterceptors(input, res) {
                        let resolvedRes = await getResolvedRes(res);

                        interceptors_res.reduce(
                            (interceptorRes, interceptor) => {
                                //拦截器对响应结果做处理，把处理后的结果返回给响应结果。
                                return c_fetch.interceptors.interceptors.responseInterceptors[
                                    interceptor
                                ](input, interceptorRes);
                            },
                            resolvedRes
                        );
                    }

                    if (interceptors_res.length) {
                        runInterceptors(input, interceptedRes);
                    }

                    //将拦截器分流后的响应结果resolve出去
                    resolve(origRes);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    //在c_fetch函数上面增加拦截器interceptors，拦截器提供request和response两种拦截器功能。
    c_fetch.interceptors = {
        interceptors: interceptors, // interceptors object passed in as fetchHook parameter, see structure as the beginning of this file.
        request: {
            use: function (callbacks) {
                for (var callback in callbacks) {
                    var type = "";
                    try {
                        type = typeof callbacks[callback];
                    } catch (e) {
                        console.assert(e)
                    }

                    if (type === "function") {
                        interceptors_req.push(callback);
                    }
                }
            }
        },
        response: {
            use: function (callbacks) {
                for (var callback in callbacks) {
                    var type = "";
                    try {
                        type = typeof callbacks[callback];
                    } catch (e) {
                        console.assert(e)
                    }

                    if (type === "function") {
                        interceptors_res.push(callback);
                    }
                }
            }
        }
    };

    // Setup interceptors.
    c_fetch.interceptors.request.use(interceptors.requestInterceptors);
    c_fetch.interceptors.response.use(interceptors.responseInterceptors);

    // hook fetch finally.
    realWindow.fetch = c_fetch;
}

export function unHookFetch(realWindow = window) {
    if (realWindow[realFetch]) realWindow.fetch = realWindow[realFetch];
    realWindow[realFetch] = undefined;
}

// export var fh = {
//     hookFetch,
//     unHookFetch
// };
