/**
 * index.js
 * @authors shenchunqian
 * @date 2021-06-17
*/

import "core-js/stable";
import "regenerator-runtime/runtime";

import { hook, unHook } from "./src/xhr-hook";
import { proxy, unProxy } from "./src/xhr-proxy";

import { hookFetch, unHookFetch } from "./src/fetch-hook";

// ah(ajax hook)
export var ah = {
    proxy,
    unProxy,
    hook,
    unHook
};

export var fh = {
    hookFetch,
    unHookFetch
};
