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
exports.id = "app/api/insight-reports/route";
exports.ids = ["app/api/insight-reports/route"];
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

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Finsight-reports%2Froute&page=%2Fapi%2Finsight-reports%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Finsight-reports%2Froute.ts&appDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Finsight-reports%2Froute&page=%2Fapi%2Finsight-reports%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Finsight-reports%2Froute.ts&appDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   originalPathname: () => (/* binding */ originalPathname),\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   requestAsyncStorage: () => (/* binding */ requestAsyncStorage),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   staticGenerationAsyncStorage: () => (/* binding */ staticGenerationAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/future/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/future/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/future/route-kind */ \"(rsc)/./node_modules/next/dist/server/future/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_User_boaz_frontend_src_app_api_insight_reports_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/insight-reports/route.ts */ \"(rsc)/./src/app/api/insight-reports/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_future_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_future_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/insight-reports/route\",\n        pathname: \"/api/insight-reports\",\n        filename: \"route\",\n        bundlePath: \"app/api/insight-reports/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\User\\\\boaz\\\\frontend\\\\src\\\\app\\\\api\\\\insight-reports\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_User_boaz_frontend_src_app_api_insight_reports_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { requestAsyncStorage, staticGenerationAsyncStorage, serverHooks } = routeModule;\nconst originalPathname = \"/api/insight-reports/route\";\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        serverHooks,\n        staticGenerationAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIuanM/bmFtZT1hcHAlMkZhcGklMkZpbnNpZ2h0LXJlcG9ydHMlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmluc2lnaHQtcmVwb3J0cyUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmluc2lnaHQtcmVwb3J0cyUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNVc2VyJTVDYm9heiU1Q2Zyb250ZW5kJTVDc3JjJTVDYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj1DJTNBJTVDVXNlcnMlNUNVc2VyJTVDYm9heiU1Q2Zyb250ZW5kJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PXN0YW5kYWxvbmUmcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O0FBQXNHO0FBQ3ZDO0FBQ2M7QUFDeUI7QUFDdEc7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLGdIQUFtQjtBQUMzQztBQUNBLGNBQWMseUVBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxpRUFBaUU7QUFDekU7QUFDQTtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUN1SDs7QUFFdkgiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mcm9udGVuZC8/ZTc3MSJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvZnV0dXJlL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXGJvYXpcXFxcZnJvbnRlbmRcXFxcc3JjXFxcXGFwcFxcXFxhcGlcXFxcaW5zaWdodC1yZXBvcnRzXFxcXHJvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcInN0YW5kYWxvbmVcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvaW5zaWdodC1yZXBvcnRzL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvaW5zaWdodC1yZXBvcnRzXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9pbnNpZ2h0LXJlcG9ydHMvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxVc2VyXFxcXGJvYXpcXFxcZnJvbnRlbmRcXFxcc3JjXFxcXGFwcFxcXFxhcGlcXFxcaW5zaWdodC1yZXBvcnRzXFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgcmVxdWVzdEFzeW5jU3RvcmFnZSwgc3RhdGljR2VuZXJhdGlvbkFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MgfSA9IHJvdXRlTW9kdWxlO1xuY29uc3Qgb3JpZ2luYWxQYXRobmFtZSA9IFwiL2FwaS9pbnNpZ2h0LXJlcG9ydHMvcm91dGVcIjtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgc2VydmVySG9va3MsXG4gICAgICAgIHN0YXRpY0dlbmVyYXRpb25Bc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCByZXF1ZXN0QXN5bmNTdG9yYWdlLCBzdGF0aWNHZW5lcmF0aW9uQXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcywgb3JpZ2luYWxQYXRobmFtZSwgcGF0Y2hGZXRjaCwgIH07XG5cbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFwcC1yb3V0ZS5qcy5tYXAiXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Finsight-reports%2Froute&page=%2Fapi%2Finsight-reports%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Finsight-reports%2Froute.ts&appDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./src/app/api/insight-reports/route.ts":
/*!**********************************************!*\
  !*** ./src/app/api/insight-reports/route.ts ***!
  \**********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next-auth */ \"(rsc)/./node_modules/next-auth/index.js\");\n/* harmony import */ var next_auth__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(next_auth__WEBPACK_IMPORTED_MODULE_1__);\n/* harmony import */ var _lib_auth__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/auth */ \"(rsc)/./src/lib/auth.ts\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n\n\n\n\nasync function GET(request) {\n    try {\n        const session = await (0,next_auth__WEBPACK_IMPORTED_MODULE_1__.getServerSession)(_lib_auth__WEBPACK_IMPORTED_MODULE_2__.authOptions);\n        if (!session?.user) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: \"Unauthorized\"\n            }, {\n                status: 401\n            });\n        }\n        const { searchParams } = new URL(request.url);\n        const customerId = searchParams.get(\"customerId\");\n        const where = {};\n        if (customerId) {\n            where.customerId = customerId;\n        }\n        const reports = await _lib_prisma__WEBPACK_IMPORTED_MODULE_3__.prisma.insightReport.findMany({\n            where,\n            include: {\n                customer: {\n                    select: {\n                        name: true\n                    }\n                },\n                createdByUser: {\n                    select: {\n                        name: true\n                    }\n                }\n            },\n            orderBy: {\n                createdAt: \"desc\"\n            }\n        });\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            data: reports\n        });\n    } catch (error) {\n        console.error(\"인사이트 보고서 조회 오류:\", error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: \"서버 오류가 발생했습니다\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9pbnNpZ2h0LXJlcG9ydHMvcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7O0FBQTJDO0FBQ0U7QUFDSjtBQUNIO0FBRS9CLGVBQWVJLElBQUlDLE9BQWdCO0lBQ3hDLElBQUk7UUFDRixNQUFNQyxVQUFVLE1BQU1MLDJEQUFnQkEsQ0FBQ0Msa0RBQVdBO1FBQ2xELElBQUksQ0FBQ0ksU0FBU0MsTUFBTTtZQUNsQixPQUFPUCxxREFBWUEsQ0FBQ1EsSUFBSSxDQUFDO2dCQUFFQyxPQUFPO1lBQWUsR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQ3BFO1FBRUEsTUFBTSxFQUFFQyxZQUFZLEVBQUUsR0FBRyxJQUFJQyxJQUFJUCxRQUFRUSxHQUFHO1FBQzVDLE1BQU1DLGFBQWFILGFBQWFJLEdBQUcsQ0FBQztRQUVwQyxNQUFNQyxRQUFhLENBQUM7UUFDcEIsSUFBSUYsWUFBWTtZQUNkRSxNQUFNRixVQUFVLEdBQUdBO1FBQ3JCO1FBRUEsTUFBTUcsVUFBVSxNQUFNZCwrQ0FBTUEsQ0FBQ2UsYUFBYSxDQUFDQyxRQUFRLENBQUM7WUFDbERIO1lBQ0FJLFNBQVM7Z0JBQ1BDLFVBQVU7b0JBQ1JDLFFBQVE7d0JBQUVDLE1BQU07b0JBQUs7Z0JBQ3ZCO2dCQUNBQyxlQUFlO29CQUNiRixRQUFRO3dCQUFFQyxNQUFNO29CQUFLO2dCQUN2QjtZQUNGO1lBQ0FFLFNBQVM7Z0JBQUVDLFdBQVc7WUFBTztRQUMvQjtRQUVBLE9BQU8xQixxREFBWUEsQ0FBQ1EsSUFBSSxDQUFDO1lBQUVtQixNQUFNVjtRQUFRO0lBQzNDLEVBQUUsT0FBT1IsT0FBTztRQUNkbUIsUUFBUW5CLEtBQUssQ0FBQyxtQkFBbUJBO1FBQ2pDLE9BQU9ULHFEQUFZQSxDQUFDUSxJQUFJLENBQ3RCO1lBQUVDLE9BQU87UUFBZ0IsR0FDekI7WUFBRUMsUUFBUTtRQUFJO0lBRWxCO0FBQ0YiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mcm9udGVuZC8uL3NyYy9hcHAvYXBpL2luc2lnaHQtcmVwb3J0cy9yb3V0ZS50cz9kNzNjIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xuaW1wb3J0IHsgZ2V0U2VydmVyU2Vzc2lvbiB9IGZyb20gXCJuZXh0LWF1dGhcIjtcbmltcG9ydCB7IGF1dGhPcHRpb25zIH0gZnJvbSBcIkAvbGliL2F1dGhcIjtcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gXCJAL2xpYi9wcmlzbWFcIjtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3Qgc2Vzc2lvbiA9IGF3YWl0IGdldFNlcnZlclNlc3Npb24oYXV0aE9wdGlvbnMpO1xuICAgIGlmICghc2Vzc2lvbj8udXNlcikge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6IFwiVW5hdXRob3JpemVkXCIgfSwgeyBzdGF0dXM6IDQwMSB9KTtcbiAgICB9XG5cbiAgICBjb25zdCB7IHNlYXJjaFBhcmFtcyB9ID0gbmV3IFVSTChyZXF1ZXN0LnVybCk7XG4gICAgY29uc3QgY3VzdG9tZXJJZCA9IHNlYXJjaFBhcmFtcy5nZXQoXCJjdXN0b21lcklkXCIpO1xuXG4gICAgY29uc3Qgd2hlcmU6IGFueSA9IHt9O1xuICAgIGlmIChjdXN0b21lcklkKSB7XG4gICAgICB3aGVyZS5jdXN0b21lcklkID0gY3VzdG9tZXJJZDtcbiAgICB9XG5cbiAgICBjb25zdCByZXBvcnRzID0gYXdhaXQgcHJpc21hLmluc2lnaHRSZXBvcnQuZmluZE1hbnkoe1xuICAgICAgd2hlcmUsXG4gICAgICBpbmNsdWRlOiB7XG4gICAgICAgIGN1c3RvbWVyOiB7XG4gICAgICAgICAgc2VsZWN0OiB7IG5hbWU6IHRydWUgfVxuICAgICAgICB9LFxuICAgICAgICBjcmVhdGVkQnlVc2VyOiB7XG4gICAgICAgICAgc2VsZWN0OiB7IG5hbWU6IHRydWUgfVxuICAgICAgICB9XG4gICAgICB9LFxuICAgICAgb3JkZXJCeTogeyBjcmVhdGVkQXQ6IFwiZGVzY1wiIH1cbiAgICB9KTtcblxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGRhdGE6IHJlcG9ydHMgfSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgY29uc29sZS5lcnJvcihcIuyduOyCrOydtO2KuCDrs7Tqs6DshJwg7KGw7ZqMIOyYpOulmDpcIiwgZXJyb3IpO1xuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcbiAgICAgIHsgZXJyb3I6IFwi7ISc67KEIOyYpOulmOqwgCDrsJzsg53tlojsirXri4jri6RcIiB9LFxuICAgICAgeyBzdGF0dXM6IDUwMCB9XG4gICAgKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbIk5leHRSZXNwb25zZSIsImdldFNlcnZlclNlc3Npb24iLCJhdXRoT3B0aW9ucyIsInByaXNtYSIsIkdFVCIsInJlcXVlc3QiLCJzZXNzaW9uIiwidXNlciIsImpzb24iLCJlcnJvciIsInN0YXR1cyIsInNlYXJjaFBhcmFtcyIsIlVSTCIsInVybCIsImN1c3RvbWVySWQiLCJnZXQiLCJ3aGVyZSIsInJlcG9ydHMiLCJpbnNpZ2h0UmVwb3J0IiwiZmluZE1hbnkiLCJpbmNsdWRlIiwiY3VzdG9tZXIiLCJzZWxlY3QiLCJuYW1lIiwiY3JlYXRlZEJ5VXNlciIsIm9yZGVyQnkiLCJjcmVhdGVkQXQiLCJkYXRhIiwiY29uc29sZSJdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/insight-reports/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/auth.ts":
/*!*************************!*\
  !*** ./src/lib/auth.ts ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   authOptions: () => (/* binding */ authOptions)\n/* harmony export */ });\n/* harmony import */ var next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next-auth/providers/credentials */ \"(rsc)/./node_modules/next-auth/providers/credentials.js\");\n/* harmony import */ var _next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @next-auth/prisma-adapter */ \"(rsc)/./node_modules/@next-auth/prisma-adapter/dist/index.js\");\n/* harmony import */ var _lib_prisma__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @/lib/prisma */ \"(rsc)/./src/lib/prisma.ts\");\n/* harmony import */ var bcryptjs__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! bcryptjs */ \"(rsc)/./node_modules/bcryptjs/index.js\");\n\n\n\n\nconst authOptions = {\n    adapter: (0,_next_auth_prisma_adapter__WEBPACK_IMPORTED_MODULE_1__.PrismaAdapter)(_lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma),\n    providers: [\n        (0,next_auth_providers_credentials__WEBPACK_IMPORTED_MODULE_0__[\"default\"])({\n            name: \"credentials\",\n            credentials: {\n                email: {\n                    label: \"이메일\",\n                    type: \"email\"\n                },\n                password: {\n                    label: \"비밀번호\",\n                    type: \"password\"\n                }\n            },\n            async authorize (credentials) {\n                if (!credentials?.email || !credentials?.password) {\n                    throw new Error(\"이메일과 비밀번호를 입력해주세요.\");\n                }\n                const user = await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.user.findUnique({\n                    where: {\n                        email: credentials.email\n                    },\n                    include: {\n                        organization: true,\n                        customer: true\n                    }\n                });\n                if (!user) {\n                    throw new Error(\"등록되지 않은 이메일입니다.\");\n                }\n                if (user.status !== \"APPROVED\") {\n                    throw new Error(\"승인 대기 중이거나 거부된 계정입니다.\");\n                }\n                if (!user.isActive) {\n                    throw new Error(\"비활성화된 계정입니다.\");\n                }\n                const isPasswordValid = await bcryptjs__WEBPACK_IMPORTED_MODULE_3__[\"default\"].compare(credentials.password, user.password);\n                if (!isPasswordValid) {\n                    throw new Error(\"비밀번호가 일치하지 않습니다.\");\n                }\n                // 로그인 정보 업데이트\n                await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.user.update({\n                    where: {\n                        id: user.id\n                    },\n                    data: {\n                        lastLoginAt: new Date(),\n                        loginCount: {\n                            increment: 1\n                        }\n                    }\n                });\n                // 활동 로그 기록\n                await _lib_prisma__WEBPACK_IMPORTED_MODULE_2__.prisma.activityLog.create({\n                    data: {\n                        userId: user.id,\n                        action: \"LOGIN\",\n                        ipAddress: null,\n                        userAgent: null\n                    }\n                });\n                return {\n                    id: user.id,\n                    email: user.email,\n                    name: user.name,\n                    role: user.role,\n                    organizationId: user.organizationId,\n                    customerId: user.customerId,\n                    customerName: user.customer?.name || null,\n                    status: user.status,\n                    passwordResetRequired: user.passwordResetRequired\n                };\n            }\n        })\n    ],\n    callbacks: {\n        async jwt ({ token, user }) {\n            if (user) {\n                token.id = user.id;\n                token.role = user.role;\n                token.organizationId = user.organizationId;\n                token.customerId = user.customerId;\n                token.customerName = user.customerName;\n                token.status = user.status;\n                token.passwordResetRequired = user.passwordResetRequired;\n            }\n            return token;\n        },\n        async session ({ session, token }) {\n            if (session.user) {\n                session.user.id = token.id;\n                session.user.role = token.role;\n                session.user.organizationId = token.organizationId;\n                session.user.customerId = token.customerId;\n                session.user.customerName = token.customerName;\n                session.user.status = token.status;\n                session.user.passwordResetRequired = token.passwordResetRequired;\n            }\n            return session;\n        }\n    },\n    pages: {\n        signIn: \"/login\",\n        error: \"/login\"\n    },\n    session: {\n        strategy: \"jwt\",\n        maxAge: 24 * 60 * 60\n    },\n    secret: process.env.NEXTAUTH_SECRET\n};\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,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QSxPQUFPLEVBQUVELEtBQUssRUFBRTtZQUM5QixJQUFJQyxRQUFRL0IsSUFBSSxFQUFFO2dCQUNmK0IsUUFBUS9CLElBQUksQ0FBU1csRUFBRSxHQUFHbUIsTUFBTW5CLEVBQUU7Z0JBQ2xDb0IsUUFBUS9CLElBQUksQ0FBU3VCLElBQUksR0FBR08sTUFBTVAsSUFBSTtnQkFDdENRLFFBQVEvQixJQUFJLENBQVN3QixjQUFjLEdBQUdNLE1BQU1OLGNBQWM7Z0JBQzFETyxRQUFRL0IsSUFBSSxDQUFTeUIsVUFBVSxHQUFHSyxNQUFNTCxVQUFVO2dCQUNsRE0sUUFBUS9CLElBQUksQ0FBUzBCLFlBQVksR0FBR0ksTUFBTUosWUFBWTtnQkFDdERLLFFBQVEvQixJQUFJLENBQVNNLE1BQU0sR0FBR3dCLE1BQU14QixNQUFNO2dCQUMxQ3lCLFFBQVEvQixJQUFJLENBQVMyQixxQkFBcUIsR0FBR0csTUFBTUgscUJBQXFCO1lBQzNFO1lBQ0EsT0FBT0k7UUFDVDtJQUNGO0lBQ0FDLE9BQU87UUFDTEMsUUFBUTtRQUNSQyxPQUFPO0lBQ1Q7SUFDQUgsU0FBUztRQUNQSSxVQUFVO1FBQ1ZDLFFBQVEsS0FBSyxLQUFLO0lBQ3BCO0lBQ0FDLFFBQVFDLFFBQVFDLEdBQUcsQ0FBQ0MsZUFBZTtBQUNyQyxFQUFFIiwic291cmNlcyI6WyJ3ZWJwYWNrOi8vZnJvbnRlbmQvLi9zcmMvbGliL2F1dGgudHM/NjY5MiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0QXV0aE9wdGlvbnMgfSBmcm9tIFwibmV4dC1hdXRoXCI7XG5pbXBvcnQgQ3JlZGVudGlhbHNQcm92aWRlciBmcm9tIFwibmV4dC1hdXRoL3Byb3ZpZGVycy9jcmVkZW50aWFsc1wiO1xuaW1wb3J0IHsgUHJpc21hQWRhcHRlciB9IGZyb20gXCJAbmV4dC1hdXRoL3ByaXNtYS1hZGFwdGVyXCI7XG5pbXBvcnQgeyBQcmlzbWFDbGllbnQgfSBmcm9tIFwiQHByaXNtYS9jbGllbnRcIjtcbmltcG9ydCB7IHByaXNtYSB9IGZyb20gXCJAL2xpYi9wcmlzbWFcIjtcbmltcG9ydCBiY3J5cHQgZnJvbSBcImJjcnlwdGpzXCI7XG5cbmV4cG9ydCBjb25zdCBhdXRoT3B0aW9uczogTmV4dEF1dGhPcHRpb25zID0ge1xuICBhZGFwdGVyOiBQcmlzbWFBZGFwdGVyKHByaXNtYSksXG4gIHByb3ZpZGVyczogW1xuICAgIENyZWRlbnRpYWxzUHJvdmlkZXIoe1xuICAgICAgbmFtZTogXCJjcmVkZW50aWFsc1wiLFxuICAgICAgY3JlZGVudGlhbHM6IHtcbiAgICAgICAgZW1haWw6IHsgbGFiZWw6IFwi7J2066mU7J28XCIsIHR5cGU6IFwiZW1haWxcIiB9LFxuICAgICAgICBwYXNzd29yZDogeyBsYWJlbDogXCLruYTrsIDrsojtmLhcIiwgdHlwZTogXCJwYXNzd29yZFwiIH1cbiAgICAgIH0sXG4gICAgICBhc3luYyBhdXRob3JpemUoY3JlZGVudGlhbHMpIHtcbiAgICAgICAgaWYgKCFjcmVkZW50aWFscz8uZW1haWwgfHwgIWNyZWRlbnRpYWxzPy5wYXNzd29yZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIuydtOuplOydvOqzvCDruYTrsIDrsojtmLjrpbwg7J6F66Cl7ZW07KO87IS47JqULlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHVzZXIgPSBhd2FpdCBwcmlzbWEudXNlci5maW5kVW5pcXVlKHtcbiAgICAgICAgICB3aGVyZTogeyBlbWFpbDogY3JlZGVudGlhbHMuZW1haWwgfSxcbiAgICAgICAgICBpbmNsdWRlOiB7XG4gICAgICAgICAgICBvcmdhbml6YXRpb246IHRydWUsXG4gICAgICAgICAgICBjdXN0b21lcjogdHJ1ZSxcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICghdXNlcikge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIuuTseuhneuQmOyngCDslYrsnYAg7J2066mU7J287J6F64uI64ukLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh1c2VyLnN0YXR1cyAhPT0gXCJBUFBST1ZFRFwiKSB7XG4gICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwi7Iq57J24IOuMgOq4sCDspJHsnbTqsbDrgpgg6rGw67aA65CcIOqzhOygleyeheuLiOuLpC5cIik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIXVzZXIuaXNBY3RpdmUpIHtcbiAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCLruYTtmZzshLHtmZTrkJwg6rOE7KCV7J6F64uI64ukLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGlzUGFzc3dvcmRWYWxpZCA9IGF3YWl0IGJjcnlwdC5jb21wYXJlKFxuICAgICAgICAgIGNyZWRlbnRpYWxzLnBhc3N3b3JkLFxuICAgICAgICAgIHVzZXIucGFzc3dvcmRcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIWlzUGFzc3dvcmRWYWxpZCkge1xuICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIuu5hOuwgOuyiO2YuOqwgCDsnbzsuZjtlZjsp4Ag7JWK7Iq164uI64ukLlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIOuhnOq3uOyduCDsoJXrs7Qg7JeF642w7J207Yq4XG4gICAgICAgIGF3YWl0IHByaXNtYS51c2VyLnVwZGF0ZSh7XG4gICAgICAgICAgd2hlcmU6IHsgaWQ6IHVzZXIuaWQgfSxcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBsYXN0TG9naW5BdDogbmV3IERhdGUoKSxcbiAgICAgICAgICAgIGxvZ2luQ291bnQ6IHsgaW5jcmVtZW50OiAxIH0sXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICAvLyDtmZzrj5kg66Gc6re4IOq4sOuhnVxuICAgICAgICBhd2FpdCBwcmlzbWEuYWN0aXZpdHlMb2cuY3JlYXRlKHtcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICB1c2VySWQ6IHVzZXIuaWQsXG4gICAgICAgICAgICBhY3Rpb246IFwiTE9HSU5cIixcbiAgICAgICAgICAgIGlwQWRkcmVzczogbnVsbCwgLy8g66+465Ok7Juo7Ja07JeQ7IScIOy2lOqwgCDqsIDriqVcbiAgICAgICAgICAgIHVzZXJBZ2VudDogbnVsbCxcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgaWQ6IHVzZXIuaWQsXG4gICAgICAgICAgZW1haWw6IHVzZXIuZW1haWwsXG4gICAgICAgICAgbmFtZTogdXNlci5uYW1lLFxuICAgICAgICAgIHJvbGU6IHVzZXIucm9sZSxcbiAgICAgICAgICBvcmdhbml6YXRpb25JZDogdXNlci5vcmdhbml6YXRpb25JZCxcbiAgICAgICAgICBjdXN0b21lcklkOiB1c2VyLmN1c3RvbWVySWQsXG4gICAgICAgICAgY3VzdG9tZXJOYW1lOiB1c2VyLmN1c3RvbWVyPy5uYW1lIHx8IG51bGwsXG4gICAgICAgICAgc3RhdHVzOiB1c2VyLnN0YXR1cyxcbiAgICAgICAgICBwYXNzd29yZFJlc2V0UmVxdWlyZWQ6IHVzZXIucGFzc3dvcmRSZXNldFJlcXVpcmVkLFxuICAgICAgICB9O1xuICAgICAgfVxuICAgIH0pXG4gIF0sXG4gIGNhbGxiYWNrczoge1xuICAgIGFzeW5jIGp3dCh7IHRva2VuLCB1c2VyIH0pIHtcbiAgICAgIGlmICh1c2VyKSB7XG4gICAgICAgIHRva2VuLmlkID0gKHVzZXIgYXMgYW55KS5pZDtcbiAgICAgICAgdG9rZW4ucm9sZSA9ICh1c2VyIGFzIGFueSkucm9sZTtcbiAgICAgICAgdG9rZW4ub3JnYW5pemF0aW9uSWQgPSAodXNlciBhcyBhbnkpLm9yZ2FuaXphdGlvbklkO1xuICAgICAgICB0b2tlbi5jdXN0b21lcklkID0gKHVzZXIgYXMgYW55KS5jdXN0b21lcklkO1xuICAgICAgICB0b2tlbi5jdXN0b21lck5hbWUgPSAodXNlciBhcyBhbnkpLmN1c3RvbWVyTmFtZTtcbiAgICAgICAgdG9rZW4uc3RhdHVzID0gKHVzZXIgYXMgYW55KS5zdGF0dXM7XG4gICAgICAgIHRva2VuLnBhc3N3b3JkUmVzZXRSZXF1aXJlZCA9ICh1c2VyIGFzIGFueSkucGFzc3dvcmRSZXNldFJlcXVpcmVkO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHRva2VuO1xuICAgIH0sXG4gICAgYXN5bmMgc2Vzc2lvbih7IHNlc3Npb24sIHRva2VuIH0pIHtcbiAgICAgIGlmIChzZXNzaW9uLnVzZXIpIHtcbiAgICAgICAgKHNlc3Npb24udXNlciBhcyBhbnkpLmlkID0gdG9rZW4uaWQgYXMgc3RyaW5nO1xuICAgICAgICAoc2Vzc2lvbi51c2VyIGFzIGFueSkucm9sZSA9IHRva2VuLnJvbGUgYXMgc3RyaW5nO1xuICAgICAgICAoc2Vzc2lvbi51c2VyIGFzIGFueSkub3JnYW5pemF0aW9uSWQgPSB0b2tlbi5vcmdhbml6YXRpb25JZCBhcyBzdHJpbmcgfCBudWxsO1xuICAgICAgICAoc2Vzc2lvbi51c2VyIGFzIGFueSkuY3VzdG9tZXJJZCA9IHRva2VuLmN1c3RvbWVySWQgYXMgc3RyaW5nIHwgbnVsbDtcbiAgICAgICAgKHNlc3Npb24udXNlciBhcyBhbnkpLmN1c3RvbWVyTmFtZSA9IHRva2VuLmN1c3RvbWVyTmFtZSBhcyBzdHJpbmcgfCBudWxsO1xuICAgICAgICAoc2Vzc2lvbi51c2VyIGFzIGFueSkuc3RhdHVzID0gdG9rZW4uc3RhdHVzIGFzIHN0cmluZztcbiAgICAgICAgKHNlc3Npb24udXNlciBhcyBhbnkpLnBhc3N3b3JkUmVzZXRSZXF1aXJlZCA9IHRva2VuLnBhc3N3b3JkUmVzZXRSZXF1aXJlZCBhcyBib29sZWFuO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHNlc3Npb247XG4gICAgfVxuICB9LFxuICBwYWdlczoge1xuICAgIHNpZ25JbjogXCIvbG9naW5cIixcbiAgICBlcnJvcjogXCIvbG9naW5cIixcbiAgfSxcbiAgc2Vzc2lvbjoge1xuICAgIHN0cmF0ZWd5OiBcImp3dFwiLFxuICAgIG1heEFnZTogMjQgKiA2MCAqIDYwLCAvLyAyNOyLnOqwhFxuICB9LFxuICBzZWNyZXQ6IHByb2Nlc3MuZW52Lk5FWFRBVVRIX1NFQ1JFVCxcbn07XG4iXSwibmFtZXMiOlsiQ3JlZGVudGlhbHNQcm92aWRlciIsIlByaXNtYUFkYXB0ZXIiLCJwcmlzbWEiLCJiY3J5cHQiLCJhdXRoT3B0aW9ucyIsImFkYXB0ZXIiLCJwcm92aWRlcnMiLCJuYW1lIiwiY3JlZGVudGlhbHMiLCJlbWFpbCIsImxhYmVsIiwidHlwZSIsInBhc3N3b3JkIiwiYXV0aG9yaXplIiwiRXJyb3IiLCJ1c2VyIiwiZmluZFVuaXF1ZSIsIndoZXJlIiwiaW5jbHVkZSIsIm9yZ2FuaXphdGlvbiIsImN1c3RvbWVyIiwic3RhdHVzIiwiaXNBY3RpdmUiLCJpc1Bhc3N3b3JkVmFsaWQiLCJjb21wYXJlIiwidXBkYXRlIiwiaWQiLCJkYXRhIiwibGFzdExvZ2luQXQiLCJEYXRlIiwibG9naW5Db3VudCIsImluY3JlbWVudCIsImFjdGl2aXR5TG9nIiwiY3JlYXRlIiwidXNlcklkIiwiYWN0aW9uIiwiaXBBZGRyZXNzIiwidXNlckFnZW50Iiwicm9sZSIsIm9yZ2FuaXphdGlvbklkIiwiY3VzdG9tZXJJZCIsImN1c3RvbWVyTmFtZSIsInBhc3N3b3JkUmVzZXRSZXF1aXJlZCIsImNhbGxiYWNrcyIsImp3dCIsInRva2VuIiwic2Vzc2lvbiIsInBhZ2VzIiwic2lnbkluIiwiZXJyb3IiLCJzdHJhdGVneSIsIm1heEFnZSIsInNlY3JldCIsInByb2Nlc3MiLCJlbnYiLCJORVhUQVVUSF9TRUNSRVQiXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/auth.ts\n");

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
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/next-auth","vendor-chunks/@babel","vendor-chunks/jose","vendor-chunks/openid-client","vendor-chunks/bcryptjs","vendor-chunks/oauth","vendor-chunks/preact","vendor-chunks/uuid","vendor-chunks/@next-auth","vendor-chunks/yallist","vendor-chunks/preact-render-to-string","vendor-chunks/cookie","vendor-chunks/@panva","vendor-chunks/oidc-token-hash"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader.js?name=app%2Fapi%2Finsight-reports%2Froute&page=%2Fapi%2Finsight-reports%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Finsight-reports%2Froute.ts&appDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5CUser%5Cboaz%5Cfrontend&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();