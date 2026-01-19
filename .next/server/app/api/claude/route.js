"use strict";(()=>{var e={};e.id=96,e.ids=[96],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},1017:e=>{e.exports=require("path")},5805:(e,t,s)=>{s.r(t),s.d(t,{originalPathname:()=>y,patchFetch:()=>f,requestAsyncStorage:()=>p,routeModule:()=>d,serverHooks:()=>g,staticGenerationAsyncStorage:()=>m});var n={};s.r(n),s.d(n,{POST:()=>l});var r=s(9303),a=s(8716),o=s(670),i=s(7070),u=s(2146),c=s(3212);async function l(e){try{let{prompt:t,agentId:s,systemPrompt:n}=await e.json(),r=process.env.WEEDN_CLAUDE_API_KEY||c.Vi.ANTHROPIC_API_KEY;if(!t)return i.NextResponse.json({error:"Prompt requis"},{status:400});if(!r)return i.NextResponse.json({error:"API Key Anthropic non configur\xe9e"},{status:500});let a="",o=!1;if(["weedn-central","agent-ventes","agent-inventaire","agent-analytics","agent-shopify"].includes(s))try{let e=await (0,u.Wr)();o=!0,a=`

## DONN\xc9ES COMPL\xc8TES SHOPIFY WEEDN (${new Date().toLocaleString("fr-FR")})

### BOUTIQUE
- Nom: ${e.shop.name}
- Domaine: ${e.shop.domain}
- Email: ${e.shop.email}
- Devise: ${e.shop.currency}
- Pays: ${e.shop.country}

### CHIFFRE D'AFFAIRES
| P\xe9riode | CA |
|---------|-----|
| Aujourd'hui | ${e.revenue.today}€ |
| Hier | ${e.revenue.yesterday}€ |
| 7 derniers jours | ${e.revenue.last7Days}€ |
| 30 derniers jours | ${e.revenue.last30Days}€ |
| Total | ${e.revenue.total}€ |
| Panier moyen | ${e.revenue.avgOrderValue}€ |

### COMMANDES
| P\xe9riode | Nombre |
|---------|--------|
| Aujourd'hui | ${e.orders.today} |
| Hier | ${e.orders.yesterday} |
| 7 derniers jours | ${e.orders.last7Days} |
| 30 derniers jours | ${e.orders.last30Days} |
| Total | ${e.orders.total} |

### DERNI\xc8RES COMMANDES
${e.orders.recent.map(e=>`- #${e.number}: ${e.total}€ (${e.financialStatus}) - ${e.customerEmail||"Sans email"}`).join("\n")}

### PRODUITS
- Total: ${e.products.total}
- Actifs: ${e.products.active}
- Stock faible (≤5): ${e.products.lowStock}
- En rupture: ${e.products.outOfStock}

${e.products.lowStockItems.length>0?`### ⚠️ ALERTES STOCK FAIBLE
${e.products.lowStockItems.map(e=>`- ${e.title}: ${e.inventory} unit\xe9s (${e.priceRange.min}-${e.priceRange.max}€)`).join("\n")}`:""}

${e.products.outOfStockItems.length>0?`### 🚨 PRODUITS EN RUPTURE
${e.products.outOfStockItems.map(e=>`- ${e.title}`).join("\n")}`:""}

### TOP PRODUITS VENDUS
${e.topProducts.map((e,t)=>`${t+1}. ${e.title}: ${e.quantity} vendus (${e.revenue.toFixed(2)}€)`).join("\n")}

### CLIENTS
- Total: ${e.customers.total}
- Nouveaux (30j): ${e.customers.newLast30Days}

### CATALOGUE COMPLET (${e.products.all.length} produits)
${e.products.all.slice(0,30).map(e=>`- ${e.title} | Stock: ${e.inventory} | Prix: ${e.priceRange.min}-${e.priceRange.max}€ | Type: ${e.productType||"N/A"}`).join("\n")}
${e.products.all.length>30?`
... et ${e.products.all.length-30} autres produits`:""}
`}catch(e){console.error("Shopify data error:",e),a="\n⚠️ Impossible de r\xe9cup\xe9rer les donn\xe9es Shopify en temps r\xe9el.\n"}let l=`

## DONN\xc9ES KLAVIYO

### Compte: WEEDN (contact@weedn.fr)
- Adresse: 4 Rue Tiquetonne, 75002 Paris
- Timezone: Europe/Paris | Devise: EUR

### Listes (3)
- Liste d'adresses e-mail (ID: VZHJQj)
- Liste de SMS (ID: T3T2rY)
- Pr\xe9visualiser la liste (ID: SXfL6A)

### Segments (9)
| Segment | ID | Description |
|---------|-----|-------------|
| Clients VIP | VHdHBg | +5 commandes |
| Acheteurs r\xe9guliers | SEKJRx | +1 commande |
| Acheteurs potentiels | V6cEYD | Actifs 30j sans achat |
| Nouveaux abonn\xe9s | UKFDB5 | Inscrits 14j |
| Risques d'attrition | VCAtfS | Inactifs 180j |
| Opportunit\xe9s reconqu\xeate | WfBvSv | \xc0 r\xe9activer |
| Engagement 30j | Wy7x7y | Actifs 30j |
| Engagement 60j | VV6uuV | Actifs 60j |
| Engagement 90j | TvDymP | Actifs 90j |

### Campagnes: 0 active
`,d={"weedn-central":`Tu es le Chef d'Orchestre de Weedn, une boutique CBD situ\xe9e au 4 Rue Tiquetonne, 75002 Paris.
Site e-commerce: weedn.fr (Shopify)
Objectif: Augmenter le CA de 40% en 90 jours.

Tu coordonnes 8 agents sp\xe9cialis\xe9s et as acc\xe8s \xe0 TOUTES les donn\xe9es business en temps r\xe9el.
R\xe9ponds avec des analyses pr\xe9cises bas\xe9es UNIQUEMENT sur les donn\xe9es r\xe9elles ci-dessous.
${a}
${l}`,"agent-ventes":`Tu es l'Agent Ventes de Weedn.
Tu analyses les donn\xe9es Shopify en temps r\xe9el et proposes des actions concr\xe8tes pour augmenter les ventes.
Tu as acc\xe8s au CA, commandes, produits, clients et top ventes.
Base tes analyses UNIQUEMENT sur les donn\xe9es r\xe9elles.
${a}`,"agent-inventaire":`Tu es l'Agent Inventaire de Weedn.
Tu surveilles TOUS les stocks en temps r\xe9el et alertes sur les ruptures.
Tu proposes des r\xe9approvisionnements prioritaires bas\xe9s sur les ventes.
${a}`,"agent-analytics":`Tu es l'Agent Analytics de Weedn.
Tu analyses les KPIs business et cr\xe9es des rapports d\xe9taill\xe9s.
Tu as acc\xe8s \xe0 toutes les m\xe9triques: CA, commandes, produits, clients.
${a}
${l}`,"agent-shopify":`Tu es l'Agent Shopify de Weedn.
Tu d\xe9veloppes et optimises le site e-commerce weedn.fr.
Tu as acc\xe8s \xe0 tous les produits, leurs prix, stocks et performances.
Store: f24081-64.myshopify.com
${a}`,"agent-seo":`Tu es l'Agent SEO de Weedn.
Tu optimises le r\xe9f\xe9rencement de weedn.fr pour les mots-cl\xe9s CBD Paris.
Tu analyses les rankings et proposes des am\xe9liorations concr\xe8tes.
Site: weedn.fr | Boutique: 4 Rue Tiquetonne, 75002 Paris`,"agent-contenu":`Tu es l'Agent Contenu de Weedn.
Tu cr\xe9es des articles de blog, posts Instagram/Facebook et stories pour promouvoir les produits CBD.
Tu proposes du contenu engageant et conforme aux r\xe8gles publicitaires CBD.
Site: weedn.fr | Instagram: @weedn.fr`,"agent-support":`Tu es l'Agent Support de Weedn.
Tu g\xe8res les avis Google, r\xe9ponds aux clients et am\xe9liores la satisfaction.
Boutique: 4 Rue Tiquetonne, 75002 Paris
T\xe9l\xe9phone: 01 42 60 98 74`,"agent-email":`Tu es l'Agent Email de Weedn.
Tu g\xe8res les campagnes Klaviyo, cr\xe9es des newsletters et automatises les flows email.
Tu as acc\xe8s aux segments clients pour des campagnes cibl\xe9es.
${l}`},p=n||d[s]||`Tu es un assistant IA pour Weedn, une boutique CBD \xe0 Paris. Aide \xe0 augmenter le chiffre d'affaires de 40%.`,m=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json","x-api-key":r,"anthropic-version":"2023-06-01"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:4096,system:p,messages:[{role:"user",content:t}]})});if(!m.ok){let e=await m.text();return console.error("Anthropic API Error:",e),i.NextResponse.json({error:"Erreur API Anthropic",details:e},{status:m.status})}let g=await m.json();return i.NextResponse.json({success:!0,response:g.content[0]?.text||"",agentId:s,usage:g.usage,hasRealData:o})}catch(e){return console.error("Error calling Claude:",e),i.NextResponse.json({error:"Erreur serveur"},{status:500})}}let d=new r.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/claude/route",pathname:"/api/claude",filename:"route",bundlePath:"app/api/claude/route"},resolvedPagePath:"/Users/alektkt/Documents/weedn-project/weedn-command-center/src/app/api/claude/route.ts",nextConfigOutput:"",userland:n}),{requestAsyncStorage:p,staticGenerationAsyncStorage:m,serverHooks:g}=d,y="/api/claude/route";function f(){return(0,o.patchFetch)({serverHooks:g,staticGenerationAsyncStorage:m})}},3212:(e,t,s)=>{s.d(t,{Vi:()=>g,I7:()=>m,oy:()=>p,oD:()=>d});let n=require("fs");var r=s.n(n),a=s(1017),o=s.n(a);let i=process.env.WEEDN_DATA_PATH||"/Users/alektkt/Documents/weedn-project/data",u=null,c=null;function l(){if(u)return u;try{let e=o().join(i,"credentials.json"),t=r().readFileSync(e,"utf-8");return u=JSON.parse(t)}catch(e){return console.error("Erreur chargement credentials:",e),null}}function d(){if(c)return c;try{let e=o().join(i,"contacts.json"),t=r().readFileSync(e,"utf-8");return c=JSON.parse(t)}catch(e){return console.error("Erreur chargement contacts:",e),null}}function p(){let e=l();return e?.shopify?{store:e.shopify.store,storeName:e.shopify.storeName,accessToken:e.shopify.accessToken,adminUrl:e.shopify.adminUrl,apiVersion:"2024-01"}:null}function m(){let e=l();return e?.incwo?{baseUrl:e.incwo.baseUrl,accountId:e.incwo.accountId,email:e.incwo.email,address:e.incwo.address,phone:e.incwo.phone}:null}let g={ANTHROPIC_API_KEY:process.env.WEEDN_CLAUDE_API_KEY||l()?.anthropic?.apiKey,SHOPIFY_ACCESS_TOKEN:process.env.SHOPIFY_ACCESS_TOKEN||l()?.shopify?.accessToken,SHOPIFY_STORE:l()?.shopify?.store||"f24081-64.myshopify.com",SUPABASE_URL:"https://cmgpflxqunkrrbndtnne.supabase.co",SUPABASE_ANON_KEY:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNtZ3BmbHhxdW5rcnJibmR0bm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3OTg3OTMsImV4cCI6MjA4NDM3NDc5M30.tgF84dpOJv3h9zyDpxMr72wbqM46a_MbBu3uqQDPwVY",MAKE_API_TOKEN:process.env.MAKE_API_TOKEN||l()?.make?.apiToken,MAKE_ORG_ID:l()?.make?.organizationId,IS_PRODUCTION:!0,DATA_PATH:i}},2146:(e,t,s)=>{s.d(t,{Wr:()=>c});var n=s(3212);async function r(e,t){let s=(0,n.oy)()||{store:process.env.SHOPIFY_STORE||"f24081-64.myshopify.com",accessToken:process.env.SHOPIFY_ACCESS_TOKEN};if(!s.accessToken)throw Error("Shopify non configur\xe9: token manquant");let r=await fetch(`https://${s.store}/admin/api/2024-01${e}`,{...t,headers:{"X-Shopify-Access-Token":s.accessToken,"Content-Type":"application/json",...t?.headers}});if(!r.ok){let e=await r.text();throw Error(`Shopify API Error: ${r.status} - ${e}`)}return r.json()}async function a(e){let t=new URLSearchParams;e?.limit&&t.set("limit",e.limit.toString()),e?.status&&t.set("status",e.status),e?.created_at_min&&t.set("created_at_min",e.created_at_min),e?.created_at_max&&t.set("created_at_max",e.created_at_max),e?.financial_status&&t.set("financial_status",e.financial_status),e?.fulfillment_status&&t.set("fulfillment_status",e.fulfillment_status);let s=t.toString()?`?${t.toString()}`:"";return r(`/orders.json${s}`)}async function o(e){let t=new URLSearchParams;e?.limit&&t.set("limit",e.limit.toString()),e?.status&&t.set("status",e.status),e?.product_type&&t.set("product_type",e.product_type),e?.vendor&&t.set("vendor",e.vendor),e?.collection_id&&t.set("collection_id",e.collection_id);let s=t.toString()?`?${t.toString()}`:"";return r(`/products.json${s}`)}async function i(e){let t=new URLSearchParams;e?.limit&&t.set("limit",e.limit.toString()),e?.created_at_min&&t.set("created_at_min",e.created_at_min),e?.updated_at_min&&t.set("updated_at_min",e.updated_at_min);let s=t.toString()?`?${t.toString()}`:"";return r(`/customers.json${s}`)}async function u(){return r("/shop.json")}async function c(){let[e,t,s,n]=await Promise.all([a({limit:250,status:"any"}),o({limit:250}),i({limit:250}),u()]),r=e.orders||[],c=t.products||[],l=s.customers||[],d=n.shop||{},p=new Date,m=p.toISOString().split("T")[0],g=new Date(p.getTime()-864e5).toISOString().split("T")[0],y=new Date(p.getTime()-6048e5).toISOString(),f=new Date(p.getTime()-2592e6).toISOString(),x=r.filter(e=>e.created_at?.startsWith(m)),S=r.filter(e=>e.created_at?.startsWith(g)),h=r.filter(e=>new Date(e.created_at)>=new Date(y)),T=r.filter(e=>new Date(e.created_at)>=new Date(f)),_=e=>e.reduce((e,t)=>e+parseFloat(t.total_price||0),0),v=_(x),E=_(S),A=_(h),I=_(T),$=_(r),D=r.length>0?$/r.length:0,O=c.map(e=>({id:e.id,title:e.title,handle:e.handle,status:e.status,productType:e.product_type,vendor:e.vendor,inventory:e.variants?.reduce((e,t)=>e+(t.inventory_quantity||0),0)||0,variants:e.variants?.length||0,priceRange:{min:Math.min(...e.variants?.map(e=>parseFloat(e.price)||0)||[0]),max:Math.max(...e.variants?.map(e=>parseFloat(e.price)||0)||[0])},images:e.images?.length||0,createdAt:e.created_at,updatedAt:e.updated_at})),P=O.filter(e=>e.inventory<=5&&e.inventory>0),w=O.filter(e=>0===e.inventory),j=O.filter(e=>"active"===e.status),N=l.filter(e=>new Date(e.created_at)>=new Date(f)).length,C={};r.forEach(e=>{e.line_items?.forEach(e=>{let t=e.product_id?.toString()||e.title;C[t]||(C[t]={title:e.title,quantity:0,revenue:0}),C[t].quantity+=e.quantity,C[t].revenue+=parseFloat(e.price)*e.quantity})});let R=Object.values(C).sort((e,t)=>t.revenue-e.revenue).slice(0,10);return{shop:{name:d.name,email:d.email,domain:d.domain,currency:d.currency,timezone:d.timezone,country:d.country_name},revenue:{today:v.toFixed(2),yesterday:E.toFixed(2),last7Days:A.toFixed(2),last30Days:I.toFixed(2),total:$.toFixed(2),avgOrderValue:D.toFixed(2)},orders:{today:x.length,yesterday:S.length,last7Days:h.length,last30Days:T.length,total:r.length,recent:r.slice(0,10).map(e=>({id:e.id,number:e.order_number,total:e.total_price,currency:e.currency,financialStatus:e.financial_status,fulfillmentStatus:e.fulfillment_status,customerEmail:e.email,itemCount:e.line_items?.length||0,createdAt:e.created_at}))},products:{total:c.length,active:j.length,lowStock:P.length,outOfStock:w.length,lowStockItems:P,outOfStockItems:w,all:O},customers:{total:l.length,newLast30Days:N},topProducts:R,generatedAt:new Date().toISOString()}}}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),n=t.X(0,[948,972],()=>s(5805));module.exports=n})();