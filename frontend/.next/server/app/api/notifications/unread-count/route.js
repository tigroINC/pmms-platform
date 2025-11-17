"use strict";
/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/notifications/unread-count/route";
exports.ids = ["app/api/notifications/unread-count/route"];
exports.modules = {

/***/ "@prisma/client":
/*!*********************************!*\
  !*** external "@prisma/client" ***!
  \*********************************/
/***/ ((module) => {

module.exports = require("@prisma/client");

/***/ }),

/***/ "../../client/components/action-async-storage.external":
/*!*******************************************************************************!*\
  !*** external "next/dist/client/components/action-async-storage.external.js" ***!
  \*******************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/action-async-storage.external.js");

/***/ }),

/***/ "../../client/components/request-async-storage.external":
/*!********************************************************************************!*\
  !*** external "next/dist/client/components/request-async-storage.external.js" ***!
  \********************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/request-async-storage.external.js");

/***/ }),

/***/ "../../client/components/static-generation-async-storage.external":
/*!******************************************************************************************!*\
  !*** external "next/dist/client/components/static-generation-async-storage.external.js" ***!
  \******************************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/client/components/static-generation-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "assert":
/*!*************************!*\
  !*** external "assert" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("assert");

/***/ }),

/***/ "buffer":
/*!*************************!*\
  !*** external "buffer" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("buffer");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("crypto");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

module.exports = require("events");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

module.exports = require("https");

/***/ }),

/***/ "querystring":
/*!******************************!*\
  !*** external "querystring" ***!
  \******************************/
/***/ ((module) => {

module.exports = require("querystring");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("util");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

module.exports = require("zlib");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fnotifications%2Funread-count%2Froute&page=%2Fapi%2Fnotifications%2Funread-count%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fnotifications%2Funread-count%2Froute.ts&appDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fnotifications%2Funread-count%2Froute&page=%2Fapi%2Fnotifications%2Funread-count%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fnotifications%2Funread-count%2Froute.ts&appDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \**********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_User_boaz_frontend_src_app_api_notifications_unread_count_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/notifications/unread-count/route.ts */ \"(rsc)/./src/app/api/notifications/unread-count/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/notifications/unread-count/route\",\n        pathname: \"/api/notifications/unread-count\",\n        filename: \"route\",\n        bundlePath: \"app/api/notifications/unread-count/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\User\\\\boaz\\\\frontend\\\\src\\\\app\\\\api\\\\notifications\\\\unread-count\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_User_boaz_frontend_src_app_api_notifications_unread_count_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/notifications/unread-count/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZub3RpZmljYXRpb25zJTJGdW5yZWFkLWNvdW50JTJGcm91dGUmcGFnZT0lMkZhcGklMkZub3RpZmljYXRpb25zJTJGdW5yZWFkLWNvdW50JTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGbm90aWZpY2F0aW9ucyUyRnVucmVhZC1jb3VudCUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNVc2VyJTVDYm9heiU1Q2Zyb250ZW5kJTVDc3JjJTVDYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj1DJTNBJTVDVXNlcnMlNUNVc2VyJTVDYm9heiU1Q2Zyb250ZW5kJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PXN0YW5kYWxvbmUmcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDcUM7QUFDbEg7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mcm9udGVuZC8/YzVjNSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXGJvYXpcXFxcZnJvbnRlbmRcXFxcc3JjXFxcXGFwcFxcXFxhcGlcXFxcbm90aWZpY2F0aW9uc1xcXFx1bnJlYWQtY291bnRcXFxccm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwic3RhbmRhbG9uZVwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9ub3RpZmljYXRpb25zL3VucmVhZC1jb3VudC9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL25vdGlmaWNhdGlvbnMvdW5yZWFkLWNvdW50XCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9ub3RpZmljYXRpb25zL3VucmVhZC1jb3VudC9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIkM6XFxcXFVzZXJzXFxcXFVzZXJcXFxcYm9helxcXFxmcm9udGVuZFxcXFxzcmNcXFxcYXBwXFxcXGFwaVxcXFxub3RpZmljYXRpb25zXFxcXHVucmVhZC1jb3VudFxcXFxyb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHJlcXVlc3RBc3luY1N0b3JhZ2UsIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmNvbnN0IG9yaWdpbmFsUGF0aG5hbWUgPSBcIi9hcGkvbm90aWZpY2F0aW9ucy91bnJlYWQtY291bnQvcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fnotifications%2Funread-count%2Froute&page=%2Fapi%2Fnotifications%2Funread-count%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fnotifications%2Funread-count%2Froute.ts&appDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/notifications/unread-count/route.ts":
/*!*********************************************************!*\
  !*** ./src/app/api/notifications/unread-count/route.ts ***!
  \*********************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/auth */ \"(rsc)/./src/lib/auth.ts\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n\n\n\n\n// GET /api/notifications/unread-count - 읽지 않은 알림 개수 조회\nasync function GET() {\n    try {\n        const session = await (0,next_auth__WEBPACK_IMPORTED_MODULE_1__.getServerSession)(_lib_auth__WEBPACK_IMPORTED_MODULE_2__.authOptions);\n        if (!session) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"인증이 필요합니다.\"\n            }, {\n                status: 401\n            });\n        }\n        const userId = session.user.id;\n        const count = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.notification.count({\n            where: {\n                userId,\n                isRead: false\n            }\n        });\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            count\n        });\n    } catch (error) {\n        console.error(\"Get unread count error:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"알림 개수 조회 중 오류가 발생했습니다.\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9ub3RpZmljYXRpb25zL3VucmVhZC1jb3VudC9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFBMkM7QUFDRTtBQUNKO0FBQ0g7QUFFdEMsdURBQXVEO0FBQ2hELGVBQWVJO0lBQ3BCLElBQUk7UUFDRixNQUFNQyxVQUFVLE1BQU1KLDJEQUFnQkEsQ0FBQ0Msa0RBQVdBO1FBQ2xELElBQUksQ0FBQ0csU0FBUztZQUNaLE9BQU9MLHFEQUFZQSxDQUFDTSxJQUFJLENBQUM7Z0JBQUVDLE9BQU87WUFBYSxHQUFHO2dCQUFFQyxRQUFRO1lBQUk7UUFDbEU7UUFFQSxNQUFNQyxTQUFTLFFBQVNDLElBQUksQ0FBU0MsRUFBRTtRQUV2QyxNQUFNQyxRQUFRLE1BQU1ULCtDQUFNQSxDQUFDVSxZQUFZLENBQUNELEtBQUssQ0FBQztZQUM1Q0UsT0FBTztnQkFDTEw7Z0JBQ0FNLFFBQVE7WUFDVjtRQUNGO1FBRUEsT0FBT2YscURBQVlBLENBQUNNLElBQUksQ0FBQztZQUFFTTtRQUFNO0lBQ25DLEVBQUUsT0FBT0wsT0FBTztRQUNkUyxRQUFRVCxLQUFLLENBQUMsMkJBQTJCQTtRQUN6QyxPQUFPUCxxREFBWUEsQ0FBQ00sSUFBSSxDQUN0QjtZQUFFQyxPQUFPO1FBQXlCLEdBQ2xDO1lBQUVDLFFBQVE7UUFBSTtJQUVsQjtBQUNGIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZnJvbnRlbmQvLi9zcmMvYXBwL2FwaS9ub3RpZmljYXRpb25zL3VucmVhZC1jb3VudC9yb3V0ZS50cz80YmJkIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuaW1wb3J0IHsgZ2V0U2VydmVyU2Vzc2lvbiB9IGZyb20gXCJuZXh0LWF1dGhcIjtcbmltcG9ydCB7IGF1dGhPcHRpb25zIH0gZnJvbSBcIkAvbGliL2F1dGhcIjtcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gXCJAL2xpYi9wcmlzbWFcIjtcblxuLy8gR0VUIC9hcGkvbm90aWZpY2F0aW9ucy91bnJlYWQtY291bnQgLSDsnb3sp4Ag7JWK7J2AIOyVjOumvCDqsJzsiJgg7KGw7ZqMXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKCkge1xuICB0cnkge1xuICAgIGNvbnN0IHNlc3Npb24gPSBhd2FpdCBnZXRTZXJ2ZXJTZXNzaW9uKGF1dGhPcHRpb25zKTtcbiAgICBpZiAoIXNlc3Npb24pIHtcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiBcIuyduOymneydtCDtlYTsmpTtlanri4jri6QuXCIgfSwgeyBzdGF0dXM6IDQwMSB9KTtcbiAgICB9XG5cbiAgICBjb25zdCB1c2VySWQgPSAoc2Vzc2lvbi51c2VyIGFzIGFueSkuaWQ7XG5cbiAgICBjb25zdCBjb3VudCA9IGF3YWl0IHByaXNtYS5ub3RpZmljYXRpb24uY291bnQoe1xuICAgICAgd2hlcmU6IHtcbiAgICAgICAgdXNlcklkLFxuICAgICAgICBpc1JlYWQ6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGNvdW50IH0pO1xuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoXCJHZXQgdW5yZWFkIGNvdW50IGVycm9yOlwiLCBlcnJvcik7XG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKFxuICAgICAgeyBlcnJvcjogXCLslYzrprwg6rCc7IiYIOyhsO2ajCDspJEg7Jik66WY6rCAIOuwnOyDne2WiOyKteuLiOuLpC5cIiB9LFxuICAgICAgeyBzdGF0dXM6IDUwMCB9XG4gICAgKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImdldFNlcnZlclNlc3Npb24iLCJhdXRoT3B0aW9ucyIsInByaXNtYSIsIkdFVCIsInNlc3Npb24iLCJqc29uIiwiZXJyb3IiLCJzdGF0dXMiLCJ1c2VySWQiLCJ1c2VyIiwiaWQiLCJjb3VudCIsIm5vdGlmaWNhdGlvbiIsIndoZXJlIiwiaXNSZWFkIiwiY29uc29sZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/notifications/unread-count/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/auth.ts":
/*!*************************!*\
  !*** ./src/lib/auth.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var _next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @next-auth/prisma-adapter */ \"(rsc)/./node_modules/@next-auth/prisma-adapter/dist/index.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n\n\n\n\nconst authOptions = {\n    adapter: (0,_next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_1__.PrismaAdapter)(_lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma),\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            name: \"credentials\",\n            credentials: {\n                email: {\n                    label: \"이메일\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"비밀번호\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.password) {\n                    throw new Error(\"이메일과 비밀번호를 입력해주세요.\");\n                }\n                const user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.user.findUnique({\n                    where: {\n                        email: credentials.email\n                    },\n                    include: {\n                        organization: true,\n                        customer: true\n                    }\n                });\n                if (!user) {\n                    throw new Error(\"등록되지 않은 이메일입니다.\");\n                }\n                if (user.status === \"PENDING\") {\n                    throw new Error(\"승인 대기 중인 계정입니다. 관리자의 승인 후 로그인하실 수 있습니다.\");\n                }\n                if (user.status === \"REJECTED\") {\n                    throw new Error(\"가입이 거부된 계정입니다. 관리자에게 문의해주세요.\");\n                }\n                if (user.status !== \"APPROVED\") {\n                    throw new Error(\"로그인할 수 없는 상태의 계정입니다. 관리자에게 문의해주세요.\");\n                }\n                if (!user.isActive) {\n                    throw new Error(\"비활성화된 계정입니다.\");\n                }\n                const isPasswordValid = await bcryptjs__WEBPACK_IMPORTED_MODULE_3__[\"default\"].compare(credentials.password, user.password);\n                if (!isPasswordValid) {\n                    throw new Error(\"비밀번호가 일치하지 않습니다.\");\n                }\n                // 로그인 정보 업데이트\n                await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.user.update({\n                    where: {\n                        id: user.id\n                    },\n                    data: {\n                        lastLoginAt: new Date(),\n                        loginCount: {\n                            increment: 1\n                        }\n                    }\n                });\n                // 활동 로그 기록\n                await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.activityLog.create({\n                    data: {\n                        userId: user.id,\n                        action: \"LOGIN\",\n                        ipAddress: null,\n                        userAgent: null\n                    }\n                });\n                return {\n                    id: user.id,\n                    email: user.email,\n                    name: user.name,\n                    role: user.role,\n                    organizationId: user.organizationId,\n                    customerId: user.customerId,\n                    customerName: user.customer?.name || null,\n                    status: user.status,\n                    passwordResetRequired: user.passwordResetRequired\n                };\n            }\n        })\n    ],\n    callbacks: {\n        async jwt ({ token, user }) {\n            if (user) {\n                token.id = user.id;\n                token.role = user.role;\n                token.organizationId = user.organizationId;\n                token.customerId = user.customerId;\n                token.customerName = user.customerName;\n                token.status = user.status;\n                token.passwordResetRequired = user.passwordResetRequired;\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session.user) {\n                session.user.id = token.id;\n                session.user.role = token.role;\n                session.user.organizationId = token.organizationId;\n                session.user.customerId = token.customerId;\n                session.user.customerName = token.customerName;\n                session.user.status = token.status;\n                session.user.passwordResetRequired = token.passwordResetRequired;\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/login\",\n        error: \"/login\"\n    },\n    session: {\n        strategy: \"jwt\",\n        maxAge: 24 * 60 * 60\n    },\n    secret: process.env.NEXTAUTH_SECRET\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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Y0EsWUFBWTtnQkFDL0NJLE1BQU14QixNQUFNLEdBQUcsS0FBY0EsTUFBTTtnQkFDbkN3QixNQUFNSCxxQkFBcUIsR0FBRyxLQUFjQSxxQkFBcUI7WUFDbkU7WUFDQSxPQUFPRztRQUNUO1FBQ0EsTUFBTUMsU0FBUSxFQUFFQSxPQUFPLEVBQUVELEtBQUssRUFBRTtZQUM5QixJQUFJQyxRQUFRL0IsSUFBSSxFQUFFO2dCQUNmK0IsUUFBUS9CLElBQUksQ0FBU1csRUFBRSxHQUFHbUIsTUFBTW5CLEVBQUU7Z0JBQ2xDb0IsUUFBUS9CLElBQUksQ0FBU3VCLElBQUksR0FBR08sTUFBTVAsSUFBSTtnQkFDdENRLFFBQVEvQixJQUFJLENBQVN3QixjQUFjLEdBQUdNLE1BQU1OLGNBQWM7Z0JBQzFETyxRQUFRL0IsSUFBSSxDQUFTeUIsVUFBVSxHQUFHSyxNQUFNTCxVQUFVO2dCQUNsRE0sUUFBUS9CLElBQUksQ0FBUzBCLFlBQVksR0FBR0ksTUFBTUosWUFBWTtnQkFDdERLLFFBQVEvQixJQUFJLENBQVNNLE1BQU0sR0FBR3dCLE1BQU14QixNQUFNO2dCQUMxQ3lCLFFBQVEvQixJQUFJLENBQVMyQixxQkFBcUIsR0FBR0csTUFBTUgscUJBQXFCO1lBQzNFO1lBQ0EsT0FBT0k7UUFDVDtJQUNGO0lBQ0FDLE9BQU87UUFDTEMsUUFBUTtRQUNSQyxPQUFPO0lBQ1Q7SUFDQUgsU0FBUztRQUNQSSxVQUFVO1FBQ1ZDLFFBQVEsS0FBSyxLQUFLO0lBQ3BCO0lBQ0FDLFFBQVFDLFFBQVFDLEdBQUcsQ0FBQ0MsZUFBZTtBQUNyQyxFQUFFIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZnJvbnRlbmQvLi9zcmMvbGliL2F1dGgudHM/NjY5MiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0QXV0aE9wdGlvbnMgfSBmcm9tIFwibmV4dC1hdXRoXCI7XG5pbXBvcnQgQ3JlZGVudGlhbHNQcm92aWRlciBmcm9tIFwibmV4dC1hdXRoL3Byb3ZpZGVycy9jcmVkZW50aWFsc1wiO1xuaW1wb3J0IHsgUHJpc21hQWRhcHRlciB9IGZyb20gXCJAbmV4dC1hdXRoL3ByaXNtYS1hZGFwdGVyXCI7XG5pbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tIFwiQHByaXNtYS9jbGllbnRcIjtcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gXCJAL2xpYi9wcmlzbWFcIjtcbmltcG9ydCBiY3J5cHQgZnJvbSBcImJjcnlwdGpzXCI7XG5cbmV4cG9ydCBjb25zdCBhdXRoT3B0aW9uczogTmV4dEF1dGhPcHRpb25zID0ge1xuICBhZGFwdGVyOiBQcmlzbWFBZGFwdGVyKHByaXNtYSksXG4gIHByb3ZpZGVyczogW1xuICAgIENyZWRlbnRpYWxzUHJvdmlkZXIoe1xuICAgICAgbmFtZTogXCJjcmVkZW50aWFsc1wiLFxuICAgICAgY3JlZGVudGlhbHM6IHtcbiAgICAgICAgZW1haWw6IHsgbGFiZWw6IFwi7J2066mU7J28XCIsIHR5cGU6IFwiZW1haWxcIiB9LFxuICAgICAgICBwYXNzd29yZDogeyBsYWJlbDogXCLruYTrsIDrsojtmLhcIiwgdHlwZTogXCJwYXNzd29yZFwiIH1cbiAgICAgIH0sXG4gICAgICBhc3luYyBhdXRob3JpemUoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgaWYgKCFjcmVkZW50aWFscz8uZW1haWwgfHwgIWNyZWRlbnRpYWxzPy5wYXNzd29yZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIuydtOuplOydvOqzvCDruYTrsIDrsojtmLjrpbwg7J6F66Cl7ZW07KO87IS47JqULlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgICAgICB3aGVyZTogeyBlbWFpbDogY3JlZGVudGlhbHMuZW1haWwgfSxcbiAgICAgICAgICBpbmNsdWRlOiB7XG4gICAgICAgICAgICBvcmdhbml6YXRpb246IHRydWUsXG4gICAgICAgICAgICBjdXN0b21lcjogdHJ1ZSxcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghdXNlcikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIuuTseuhneuQmOyngCDslYrsnYAg7J2066mU7J287J6F64uI64ukLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1c2VyLnN0YXR1cyA9PT0gXCJQRU5ESU5HXCIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCLsirnsnbgg64yA6riwIOykkeyduCDqs4TsoJXsnoXri4jri6QuIOq0gOumrOyekOydmCDsirnsnbgg7ZuEIOuhnOq3uOyduO2VmOyLpCDsiJgg7J6I7Iq164uI64ukLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1c2VyLnN0YXR1cyA9PT0gXCJSRUpFQ1RFRFwiKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwi6rCA7J6F7J20IOqxsOu2gOuQnCDqs4TsoJXsnoXri4jri6QuIOq0gOumrOyekOyXkOqyjCDrrLjsnZjtlbTso7zshLjsmpQuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHVzZXIuc3RhdHVzICE9PSBcIkFQUFJPVkVEXCIpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCLroZzqt7jsnbjtlaAg7IiYIOyXhuuKlCDsg4Htg5zsnZgg6rOE7KCV7J6F64uI64ukLiDqtIDrpqzsnpDsl5Dqsowg66y47J2Y7ZW07KO87IS47JqULlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICghdXNlci5pc0FjdGl2ZSkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIuu5hO2ZnOyEse2ZlOuQnCDqs4TsoJXsnoXri4jri6QuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgY29uc3QgaXNQYXNzd29yZFZhbGlkID0gYXdhaXQgYmNyeXB0LmNvbXBhcmUoXG4gICAgICAgICAgY3JlZGVudGlhbHMucGFzc3dvcmQsXG4gICAgICAgICAgdXNlci5wYXNzd29yZFxuICAgICAgICApO1xuXG4gICAgICAgIGlmICghaXNQYXNzd29yZFZhbGlkKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwi67mE67CA67KI7Zi46rCAIOydvOy5mO2VmOyngCDslYrsirXri4jri6QuXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8g66Gc6re47J24IOygleuztCDsl4XrjbDsnbTtirhcbiAgICAgICAgYXdhaXQgcHJpc21hLnVzZXIudXBkYXRlKHtcbiAgICAgICAgICB3aGVyZTogeyBpZDogdXNlci5pZCB9LFxuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGxhc3RMb2dpbkF0OiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgbG9naW5Db3VudDogeyBpbmNyZW1lbnQ6IDEgfSxcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vIO2ZnOuPmSDroZzqt7gg6riw66GdXG4gICAgICAgIGF3YWl0IHByaXNtYS5hY3Rpdml0eUxvZy5jcmVhdGUoe1xuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIHVzZXJJZDogdXNlci5pZCxcbiAgICAgICAgICAgIGFjdGlvbjogXCJMT0dJTlwiLFxuICAgICAgICAgICAgaXBBZGRyZXNzOiBudWxsLCAvLyDrr7jrk6Tsm6jslrTsl5DshJwg7LaU6rCAIOqwgOuKpVxuICAgICAgICAgICAgdXNlckFnZW50OiBudWxsLFxuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBpZDogdXNlci5pZCxcbiAgICAgICAgICBlbWFpbDogdXNlci5lbWFpbCxcbiAgICAgICAgICBuYW1lOiB1c2VyLm5hbWUsXG4gICAgICAgICAgcm9sZTogdXNlci5yb2xlLFxuICAgICAgICAgIG9yZ2FuaXphdGlvbklkOiB1c2VyLm9yZ2FuaXphdGlvbklkLFxuICAgICAgICAgIGN1c3RvbWVySWQ6IHVzZXIuY3VzdG9tZXJJZCxcbiAgICAgICAgICBjdXN0b21lck5hbWU6IHVzZXIuY3VzdG9tZXI/Lm5hbWUgfHwgbnVsbCxcbiAgICAgICAgICBzdGF0dXM6IHVzZXIuc3RhdHVzLFxuICAgICAgICAgIHBhc3N3b3JkUmVzZXRSZXF1aXJlZDogdXNlci5wYXNzd29yZFJlc2V0UmVxdWlyZWQsXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgfSlcbiAgXSxcbiAgY2FsbGJhY2tzOiB7XG4gICAgYXN5bmMgand0KHsgdG9rZW4sIHVzZXIgfSkge1xuICAgICAgaWYgKHVzZXIpIHtcbiAgICAgICAgdG9rZW4uaWQgPSAodXNlciBhcyBhbnkpLmlkO1xuICAgICAgICB0b2tlbi5yb2xlID0gKHVzZXIgYXMgYW55KS5yb2xlO1xuICAgICAgICB0b2tlbi5vcmdhbml6YXRpb25JZCA9ICh1c2VyIGFzIGFueSkub3JnYW5pemF0aW9uSWQ7XG4gICAgICAgIHRva2VuLmN1c3RvbWVySWQgPSAodXNlciBhcyBhbnkpLmN1c3RvbWVySWQ7XG4gICAgICAgIHRva2VuLmN1c3RvbWVyTmFtZSA9ICh1c2VyIGFzIGFueSkuY3VzdG9tZXJOYW1lO1xuICAgICAgICB0b2tlbi5zdGF0dXMgPSAodXNlciBhcyBhbnkpLnN0YXR1cztcbiAgICAgICAgdG9rZW4ucGFzc3dvcmRSZXNldFJlcXVpcmVkID0gKHVzZXIgYXMgYW55KS5wYXNzd29yZFJlc2V0UmVxdWlyZWQ7XG4gICAgICB9XG4gICAgICByZXR1cm4gdG9rZW47XG4gICAgfSxcbiAgICBhc3luYyBzZXNzaW9uKHsgc2Vzc2lvbiwgdG9rZW4gfSkge1xuICAgICAgaWYgKHNlc3Npb24udXNlcikge1xuICAgICAgICAoc2Vzc2lvbi51c2VyIGFzIGFueSkuaWQgPSB0b2tlbi5pZCBhcyBzdHJpbmc7XG4gICAgICAgIChzZXNzaW9uLnVzZXIgYXMgYW55KS5yb2xlID0gdG9rZW4ucm9sZSBhcyBzdHJpbmc7XG4gICAgICAgIChzZXNzaW9uLnVzZXIgYXMgYW55KS5vcmdhbml6YXRpb25JZCA9IHRva2VuLm9yZ2FuaXphdGlvbklkIGFzIHN0cmluZyB8IG51bGw7XG4gICAgICAgIChzZXNzaW9uLnVzZXIgYXMgYW55KS5jdXN0b21lcklkID0gdG9rZW4uY3VzdG9tZXJJZCBhcyBzdHJpbmcgfCBudWxsO1xuICAgICAgICAoc2Vzc2lvbi51c2VyIGFzIGFueSkuY3VzdG9tZXJOYW1lID0gdG9rZW4uY3VzdG9tZXJOYW1lIGFzIHN0cmluZyB8IG51bGw7XG4gICAgICAgIChzZXNzaW9uLnVzZXIgYXMgYW55KS5zdGF0dXMgPSB0b2tlbi5zdGF0dXMgYXMgc3RyaW5nO1xuICAgICAgICAoc2Vzc2lvbi51c2VyIGFzIGFueSkucGFzc3dvcmRSZXNldFJlcXVpcmVkID0gdG9rZW4ucGFzc3dvcmRSZXNldFJlcXVpcmVkIGFzIGJvb2xlYW47XG4gICAgICB9XG4gICAgICByZXR1cm4gc2Vzc2lvbjtcbiAgICB9XG4gIH0sXG4gIHBhZ2VzOiB7XG4gICAgc2lnbkluOiBcIi9sb2dpblwiLFxuICAgIGVycm9yOiBcIi9sb2dpblwiLFxuICB9LFxuICBzZXNzaW9uOiB7XG4gICAgc3RyYXRlZ3k6IFwiand0XCIsXG4gICAgbWF4QWdlOiAyNCAqIDYwICogNjAsIC8vIDI07Iuc6rCEXG4gIH0sXG4gIHNlY3JldDogcHJvY2Vzcy5lbnYuTkVYVEFVVEhfU0VDUkVULFxufTtcbiJdLCJuYW1lcyI6WyJDcmVkZW50aWFsc1Byb3ZpZGVyIiwiUHJpc21hQWRhcHRlciIsInByaXNtYSIsImJjcnlwdCIsImF1dGhPcHRpb25zIiwiYWRhcHRlciIsInByb3ZpZGVycyIsIm5hbWUiLCJjcmVkZW50aWFscyIsImVtYWlsIiwibGFiZWwiLCJ0eXBlIiwicGFzc3dvcmQiLCJhdXRob3JpemUiLCJFcnJvciIsInVzZXIiLCJmaW5kVW5pcXVlIiwid2hlcmUiLCJpbmNsdWRlIiwib3JnYW5pemF0aW9uIiwiY3VzdG9tZXIiLCJzdGF0dXMiLCJpc0FjdGl2ZSIsImlzUGFzc3dvcmRWYWxpZCIsImNvbXBhcmUiLCJ1cGRhdGUiLCJpZCIsImRhdGEiLCJsYXN0TG9naW5BdCIsIkRhdGUiLCJsb2dpbkNvdW50IiwiaW5jcmVtZW50IiwiYWN0aXZpdHlMb2ciLCJjcmVhdGUiLCJ1c2VySWQiLCJhY3Rpb24iLCJpcEFkZHJlc3MiLCJ1c2VyQWdlbnQiLCJyb2xlIiwib3JnYW5pemF0aW9uSWQiLCJjdXN0b21lcklkIiwiY3VzdG9tZXJOYW1lIiwicGFzc3dvcmRSZXNldFJlcXVpcmVkIiwiY2FsbGJhY2tzIiwiand0IiwidG9rZW4iLCJzZXNzaW9uIiwicGFnZXMiLCJzaWduSW4iLCJlcnJvciIsInN0cmF0ZWd5IiwibWF4QWdlIiwic2VjcmV0IiwicHJvY2VzcyIsImVudiIsIk5FWFRBVVRIX1NFQ1JFVCJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/prisma.ts":
/*!***************************!*\
  !*** ./src/lib/prisma.ts ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   prisma: () => (/* binding */ prisma)\n/* harmony export */ });\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @prisma/client */ \"@prisma/client\");\n/* harmony import */ var _prisma_client__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_prisma_client__WEBPACK_IMPORTED_MODULE_0__);\n\nconst globalForPrisma = global;\nconst prisma = globalForPrisma.prisma || new _prisma_client__WEBPACK_IMPORTED_MODULE_0__.PrismaClient({\n    log: [\n        \"warn\",\n        \"error\"\n    ]\n});\nif (true) globalForPrisma.prisma = prisma;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3ByaXNtYS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBOEM7QUFFOUMsTUFBTUMsa0JBQWtCQztBQUVqQixNQUFNQyxTQUNYRixnQkFBZ0JFLE1BQU0sSUFDdEIsSUFBSUgsd0RBQVlBLENBQUM7SUFDZkksS0FBSztRQUFDO1FBQVE7S0FBUTtBQUN4QixHQUFHO0FBRUwsSUFBSUMsSUFBcUMsRUFBRUosZ0JBQWdCRSxNQUFNLEdBQUdBIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZnJvbnRlbmQvLi9zcmMvbGliL3ByaXNtYS50cz8wMWQ3Il0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IFByaXNtYUNsaWVudCB9IGZyb20gXCJAcHJpc21hL2NsaWVudFwiO1xuXG5jb25zdCBnbG9iYWxGb3JQcmlzbWEgPSBnbG9iYWwgYXMgdW5rbm93biBhcyB7IHByaXNtYT86IFByaXNtYUNsaWVudCB9O1xuXG5leHBvcnQgY29uc3QgcHJpc21hID1cbiAgZ2xvYmFsRm9yUHJpc21hLnByaXNtYSB8fFxuICBuZXcgUHJpc21hQ2xpZW50KHtcbiAgICBsb2c6IFtcIndhcm5cIiwgXCJlcnJvclwiXSxcbiAgfSk7XG5cbmlmIChwcm9jZXNzLmVudi5OT0RFX0VOViAhPT0gXCJwcm9kdWN0aW9uXCIpIGdsb2JhbEZvclByaXNtYS5wcmlzbWEgPSBwcmlzbWE7XG4iXSwibmFtZXMiOlsiUHJpc21hQ2xpZW50IiwiZ2xvYmFsRm9yUHJpc21hIiwiZ2xvYmFsIiwicHJpc21hIiwibG9nIiwicHJvY2VzcyJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/prisma.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/bcryptjs","vendor-chunks/oauth","vendor-chunks/preact","vendor-chunks/uuid","vendor-chunks/@next-auth","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/cookie","vendor-chunks/@panva","vendor-chunks/oidc-token-hash"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Fnotifications%2Funread-count%2Froute&page=%2Fapi%2Fnotifications%2Funread-count%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fnotifications%2Funread-count%2Froute.ts&appDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();