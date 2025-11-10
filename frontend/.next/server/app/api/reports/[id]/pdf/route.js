"use strict";(()=>{var t={};t.id=5322,t.ids=[5322],t.modules={72934:t=>{t.exports=require("next/dist/client/components/action-async-storage.external.js")},54580:t=>{t.exports=require("next/dist/client/components/request-async-storage.external.js")},45869:t=>{t.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},20399:t=>{t.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:t=>{t.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:t=>{t.exports=require("assert")},78893:t=>{t.exports=require("buffer")},84770:t=>{t.exports=require("crypto")},17702:t=>{t.exports=require("events")},32615:t=>{t.exports=require("http")},35240:t=>{t.exports=require("https")},86624:t=>{t.exports=require("querystring")},17360:t=>{t.exports=require("url")},21764:t=>{t.exports=require("util")},71568:t=>{t.exports=require("zlib")},65462:t=>{t.exports=import("puppeteer")},1152:(t,e,s)=>{s.a(t,async(t,a)=>{try{s.r(e),s.d(e,{originalPathname:()=>h,patchFetch:()=>n,requestAsyncStorage:()=>c,routeModule:()=>p,serverHooks:()=>m,staticGenerationAsyncStorage:()=>u});var r=s(49303),d=s(88716),l=s(60670),i=s(66073),o=t([i]);i=(o.then?(await o)():o)[0];let p=new r.AppRouteRouteModule({definition:{kind:d.x.APP_ROUTE,page:"/api/reports/[id]/pdf/route",pathname:"/api/reports/[id]/pdf",filename:"route",bundlePath:"app/api/reports/[id]/pdf/route"},resolvedPagePath:"C:\\Users\\User\\boaz\\frontend\\src\\app\\api\\reports\\[id]\\pdf\\route.ts",nextConfigOutput:"standalone",userland:i}),{requestAsyncStorage:c,staticGenerationAsyncStorage:u,serverHooks:m}=p,h="/api/reports/[id]/pdf/route";function n(){return(0,l.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:u})}a()}catch(t){a(t)}})},66073:(t,e,s)=>{s.a(t,async(t,a)=>{try{s.r(e),s.d(e,{GET:()=>p});var r=s(87070),d=s(75571),l=s(95456),i=s(20728),o=s(65462),n=t([o]);async function p(t,{params:e}){try{let t=await (0,d.getServerSession)(l.L);if(!t?.user)return r.NextResponse.json({error:"Unauthorized"},{status:401});let s=t.user,{id:a}=e,n=await i._.report.findUnique({where:{id:a},include:{customer:!0,stack:!0}});if(!n)return r.NextResponse.json({error:"보고서를 찾을 수 없습니다."},{status:404});if("CUSTOMER"===s.role&&(n.customerId!==s.customerId||"SHARED"!==n.status))return r.NextResponse.json({error:"권한이 없습니다."},{status:403});let p=function(t){let e=JSON.parse(t.measurements||"[]").filter(t=>null!==t.value&&void 0!==t.value&&""!==t.value&&0!==t.value);return`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Malgun Gothic', '맑은 고딕', sans-serif; font-size: 7pt; line-height: 1.2; }
    .container { padding: 8px; }
    table { width: 100%; border-collapse: collapse; margin: 0; }
    th, td { border: 1px solid #000; padding: 2px 3px; text-align: center; font-size: 7pt; }
    th { background-color: #e8e8e8; font-weight: bold; }
    .section-title { background-color: #d0d0d0; font-weight: bold; text-align: center; padding: 3px; }
    .label { background-color: #f0f0f0; font-weight: bold; font-size: 6.5pt; }
    .vertical-label { 
      writing-mode: vertical-rl; 
      text-orientation: upright; 
      background-color: #f0f0f0; 
      font-weight: bold; 
      font-size: 7pt; 
      padding: 2px 0;
      width: 4px;
      letter-spacing: 0;
      line-height: 1;
    }
    .text-left { text-align: left; padding-left: 4px; }
    .text-right { text-align: right; padding-right: 4px; }
    .small { font-size: 6pt; }
  </style>
</head>
<body>
  <div class="container">
    <!-- 제목 -->
    <table>
      <tr>
        <td colspan="14" style="border: 1px solid #000; padding: 6px; text-align: center;">
          <div style="font-size: 14pt; font-weight: bold;">대기측정기록부</div>
          <div style="font-size: 6pt; color: #666; margin-top: 2px;">(이 서식은 「대기환경보전법 시행규칙」별표 8「대기오염물질의 배출허가증 또는 공동에서 측정한 결과에 작성한다.)</div>
        </td>
      </tr>
    </table>
    
    <!-- 의뢰인 정보 + 일반현황 -->
    <table>
      <tr style="height: 20px;">
        <td class="vertical-label" rowspan="4" style="width: 4px;">①의뢰인</td>
        <td class="label" style="width: 12%;">상호(사업장명)</td>
        <td style="width: 30%;">${t.companyName||""}</td>
        <td class="vertical-label" rowspan="3" style="width: 4px; height: 80px;">②일반현황</td>
        <td class="label" style="width: 12%; height: 27px;">업종</td>
        <td style="width: 30%; height: 27px;">${t.industry||""}</td>
      </tr>
      <tr style="height: 20px;">
        <td class="label">사업장소재지(주소)</td>
        <td>${t.address||""}</td>
        <td class="label" style="height: 27px;">시설종류</td>
        <td style="height: 27px;">${t.facilityType||""}</td>
      </tr>
      <tr style="height: 20px;">
        <td class="label">대표자(의뢰인)</td>
        <td>${t.representative||""}</td>
        <td class="label" style="height: 26px;">사업장종별</td>
        <td style="height: 26px;">${t.siteCategory||""}</td>
      </tr>
      <tr style="height: 20px;">
        <td class="label">환경기술인</td>
        <td>${t.environmentalTech||""}</td>
        <td colspan="3"></td>
      </tr>
    </table>
    
    <!-- 의뢰내용 -->
    <table>
      <tr>
        <td class="vertical-label" rowspan="3" style="width: 4px;">③의뢰내용</td>
        <td class="label">측정용도</td>
        <td colspan="5">${t.purpose||""}</td>
      </tr>
      <tr>
        <td class="label">굴뚝명칭</td>
        <td>${t.stackName||""}</td>
        <td class="label">높이(m)</td>
        <td>${t.stackHeight||""}</td>
        <td class="label">안지름(m)</td>
        <td>${t.stackDiameter||""}</td>
      </tr>
      <tr>
        <td class="label">굴뚝종별</td>
        <td>${t.stackType||""}</td>
        <td class="label">의뢰항목</td>
        <td colspan="3">${t.requestedItems||""}</td>
      </tr>
    </table>
    
    <!-- 시료채취 -->
    <table>
      <tr>
        <td class="vertical-label" rowspan="5" style="width: 4px;">④시료채취</td>
        <td class="label">날씨</td>
        <td>${t.weather||""}</td>
        <td class="label">기온(℃)</td>
        <td>${t.temp||""}</td>
        <td class="label">습도(%)</td>
        <td>${t.humidity||""}</td>
        <td class="label">기압(mmHg)</td>
        <td>${t.pressure||""}</td>
      </tr>
      <tr>
        <td class="label">풍향</td>
        <td>${t.windDir||""}</td>
        <td class="label">풍속(m/sec)</td>
        <td>${t.wind||""}</td>
        <td class="label">가스속도(m/s)</td>
        <td>${t.gasVel||""}</td>
        <td class="label">가스온도(℃)</td>
        <td>${t.gasTemp||""}</td>
      </tr>
      <tr>
        <td class="label">수분함량(%)</td>
        <td>${t.moisture||""}</td>
        <td class="label">실측산소농도(%)</td>
        <td>${t.o2Measured||""}</td>
        <td class="label">표준산소농도(%)</td>
        <td>${t.o2Standard||""}</td>
        <td class="label">배출가스유량(S㎥/min)</td>
        <td>${t.flow||""}</td>
      </tr>
      <tr>
        <td class="label">배출가스 기타</td>
        <td colspan="7">${t.gasNote||""}</td>
      </tr>
      <tr>
        <td class="label">채취일</td>
        <td>${new Date(t.samplingDate).toLocaleDateString()}</td>
        <td class="label">채취시간</td>
        <td>${t.samplingStart||""} ~ ${t.samplingEnd||""}</td>
        <td class="label">시료채취자</td>
        <td colspan="3">${t.sampler||""}</td>
      </tr>
    </table>
    
    <!-- 측정분석결과 -->
    <table>
      <tr>
        <td class="vertical-label" rowspan="${e.length+3}" style="width: 4px;">⑤측정분석결과</td>
        <th>측정항목</th>
        <th>허용기준</th>
        <th>분석값</th>
        <th>단위</th>
        <th>측정분석방법</th>
        <th>측정시간(시작)</th>
        <th>측정시간(종료)</th>
      </tr>
      ${e.map(t=>`
      <tr>
        <td>${t.item||""}</td>
        <td>${t.limit||""}</td>
        <td>${t.value||""}</td>
        <td>${t.unit||""}</td>
        <td>${t.method||""}</td>
        <td>${t.startTime||""}</td>
        <td>${t.endTime||""}</td>
      </tr>
      `).join("")}
      <tr>
        <td class="label">분석기간</td>
        <td colspan="6">${t.analysisStart||""} ~ ${t.analysisEnd||""}</td>
      </tr>
      <tr>
        <td class="label">분석기술인</td>
        <td colspan="3">${t.analyst||""}</td>
        <td class="label">책임기술인</td>
        <td colspan="2">${t.chiefTech||""}</td>
      </tr>
    </table>
    
    <!-- 종합의견 -->
    <table>
      <tr>
        <td class="section-title">종합의견</td>
      </tr>
      <tr>
        <td class="text-left" style="min-height: 80px; padding: 10px;">${t.opinion||""}</td>
      </tr>
    </table>
  </div>
</body>
</html>
  `}(n),c=await o.default.launch({headless:!0,args:["--no-sandbox","--disable-setuid-sandbox"]}),u=await c.newPage();await u.setContent(p,{waitUntil:"networkidle0"});let m=await u.pdf({format:"A4",printBackground:!0,margin:{top:"8mm",right:"6mm",bottom:"8mm",left:"6mm"}});await c.close();let h=`Report_${n.customer.name}_${new Date(n.measuredAt).toISOString().split("T")[0]}.pdf`;return new r.NextResponse(Buffer.from(m),{headers:{"Content-Type":"application/pdf","Content-Disposition":`attachment; filename="${encodeURIComponent(h)}"`}})}catch(t){return r.NextResponse.json({error:t.message||"PDF 생성 실패"},{status:500})}}o=(n.then?(await n)():n)[0],a()}catch(t){a(t)}})},95456:(t,e,s)=>{s.d(e,{L:()=>i});var a=s(53797),r=s(13539),d=s(20728),l=s(98691);let i={adapter:(0,r.N)(d._),providers:[(0,a.Z)({name:"credentials",credentials:{email:{label:"이메일",type:"email"},password:{label:"비밀번호",type:"password"}},async authorize(t){if(!t?.email||!t?.password)throw Error("이메일과 비밀번호를 입력해주세요.");let e=await d._.user.findUnique({where:{email:t.email},include:{organization:!0,customer:!0}});if(!e)throw Error("등록되지 않은 이메일입니다.");if("APPROVED"!==e.status)throw Error("승인 대기 중이거나 거부된 계정입니다.");if(!e.isActive)throw Error("비활성화된 계정입니다.");if(!await l.ZP.compare(t.password,e.password))throw Error("비밀번호가 일치하지 않습니다.");return await d._.user.update({where:{id:e.id},data:{lastLoginAt:new Date,loginCount:{increment:1}}}),await d._.activityLog.create({data:{userId:e.id,action:"LOGIN",ipAddress:null,userAgent:null}}),{id:e.id,email:e.email,name:e.name,role:e.role,organizationId:e.organizationId,customerId:e.customerId,customerName:e.customer?.name||null,status:e.status,passwordResetRequired:e.passwordResetRequired}}})],callbacks:{jwt:async({token:t,user:e})=>(e&&(t.id=e.id,t.role=e.role,t.organizationId=e.organizationId,t.customerId=e.customerId,t.customerName=e.customerName,t.status=e.status,t.passwordResetRequired=e.passwordResetRequired),t),session:async({session:t,token:e})=>(t.user&&(t.user.id=e.id,t.user.role=e.role,t.user.organizationId=e.organizationId,t.user.customerId=e.customerId,t.user.customerName=e.customerName,t.user.status=e.status,t.user.passwordResetRequired=e.passwordResetRequired),t)},pages:{signIn:"/login",error:"/login"},session:{strategy:"jwt",maxAge:86400},secret:process.env.NEXTAUTH_SECRET}},20728:(t,e,s)=>{s.d(e,{_:()=>r});let a=require("@prisma/client"),r=global.prisma||new a.PrismaClient({log:["warn","error"]})}};var e=require("../../../../../webpack-runtime.js");e.C(t);var s=t=>e(e.s=t),a=e.X(0,[8948,5972,8691,9637],()=>s(1152));module.exports=a})();