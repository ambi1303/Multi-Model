import{q as r,p as e,r as a,s as t,x as o,y as n,bb as i,j as s,z as l,D as u,G as b,J as d,bY as f,aC as c,am as m,an as p}from"./index-bax0hkam.js";function v(e){return r("MuiLinearProgress",e)}e("MuiLinearProgress",["root","colorPrimary","colorSecondary","determinate","indeterminate","buffer","query","dashed","dashedColorPrimary","dashedColorSecondary","bar","barColorPrimary","barColorSecondary","bar1Indeterminate","bar1Determinate","bar1Buffer","bar2Indeterminate","bar2Buffer"]);const h=["className","color","value","valueBuffer","variant"];let g,y,w,C,x,S,$=r=>r;const k=c(g||(g=$`
  0% {
    left: -35%;
    right: 100%;
  }

  60% {
    left: 100%;
    right: -90%;
  }

  100% {
    left: 100%;
    right: -90%;
  }
`)),P=c(y||(y=$`
  0% {
    left: -200%;
    right: 100%;
  }

  60% {
    left: 107%;
    right: -8%;
  }

  100% {
    left: 107%;
    right: -8%;
  }
`)),B=c(w||(w=$`
  0% {
    opacity: 1;
    background-position: 0 -23px;
  }

  60% {
    opacity: 0;
    background-position: 0 -23px;
  }

  100% {
    opacity: 1;
    background-position: -200px -23px;
  }
`)),q=(r,e)=>"inherit"===e?"currentColor":r.vars?r.vars.palette.LinearProgress[`${e}Bg`]:"light"===r.palette.mode?m(r.palette[e].main,.62):p(r.palette[e].main,.5),I=l("span",{name:"MuiLinearProgress",slot:"Root",overridesResolver:(r,e)=>{const{ownerState:a}=r;return[e.root,e[`color${b(a.color)}`],e[a.variant]]}})(({ownerState:r,theme:e})=>n({position:"relative",overflow:"hidden",display:"block",height:4,zIndex:0,"@media print":{colorAdjust:"exact"},backgroundColor:q(e,r.color)},"inherit"===r.color&&"buffer"!==r.variant&&{backgroundColor:"none","&::before":{content:'""',position:"absolute",left:0,top:0,right:0,bottom:0,backgroundColor:"currentColor",opacity:.3}},"buffer"===r.variant&&{backgroundColor:"transparent"},"query"===r.variant&&{transform:"rotate(180deg)"})),L=l("span",{name:"MuiLinearProgress",slot:"Dashed",overridesResolver:(r,e)=>{const{ownerState:a}=r;return[e.dashed,e[`dashedColor${b(a.color)}`]]}})(({ownerState:r,theme:e})=>{const a=q(e,r.color);return n({position:"absolute",marginTop:0,height:"100%",width:"100%"},"inherit"===r.color&&{opacity:.3},{backgroundImage:`radial-gradient(${a} 0%, ${a} 16%, transparent 42%)`,backgroundSize:"10px 10px",backgroundPosition:"0 -23px"})},f(C||(C=$`
    animation: ${0} 3s infinite linear;
  `),B)),M=l("span",{name:"MuiLinearProgress",slot:"Bar1",overridesResolver:(r,e)=>{const{ownerState:a}=r;return[e.bar,e[`barColor${b(a.color)}`],("indeterminate"===a.variant||"query"===a.variant)&&e.bar1Indeterminate,"determinate"===a.variant&&e.bar1Determinate,"buffer"===a.variant&&e.bar1Buffer]}})(({ownerState:r,theme:e})=>n({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left",backgroundColor:"inherit"===r.color?"currentColor":(e.vars||e).palette[r.color].main},"determinate"===r.variant&&{transition:"transform .4s linear"},"buffer"===r.variant&&{zIndex:1,transition:"transform .4s linear"}),({ownerState:r})=>("indeterminate"===r.variant||"query"===r.variant)&&f(x||(x=$`
      width: auto;
      animation: ${0} 2.1s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
    `),k)),j=l("span",{name:"MuiLinearProgress",slot:"Bar2",overridesResolver:(r,e)=>{const{ownerState:a}=r;return[e.bar,e[`barColor${b(a.color)}`],("indeterminate"===a.variant||"query"===a.variant)&&e.bar2Indeterminate,"buffer"===a.variant&&e.bar2Buffer]}})(({ownerState:r,theme:e})=>n({width:"100%",position:"absolute",left:0,bottom:0,top:0,transition:"transform 0.2s linear",transformOrigin:"left"},"buffer"!==r.variant&&{backgroundColor:"inherit"===r.color?"currentColor":(e.vars||e).palette[r.color].main},"inherit"===r.color&&{opacity:.3},"buffer"===r.variant&&{backgroundColor:q(e,r.color),transition:"transform .4s linear"}),({ownerState:r})=>("indeterminate"===r.variant||"query"===r.variant)&&f(S||(S=$`
      width: auto;
      animation: ${0} 2.1s cubic-bezier(0.165, 0.84, 0.44, 1) 1.15s infinite;
    `),P)),z=a.forwardRef(function(r,e){const a=t({props:r,name:"MuiLinearProgress"}),{className:l,color:f="primary",value:c,valueBuffer:m,variant:p="indeterminate"}=a,g=o(a,h),y=n({},a,{color:f,variant:p}),w=(r=>{const{classes:e,variant:a,color:t}=r,o={root:["root",`color${b(t)}`,a],dashed:["dashed",`dashedColor${b(t)}`],bar1:["bar",`barColor${b(t)}`,("indeterminate"===a||"query"===a)&&"bar1Indeterminate","determinate"===a&&"bar1Determinate","buffer"===a&&"bar1Buffer"],bar2:["bar","buffer"!==a&&`barColor${b(t)}`,"buffer"===a&&`color${b(t)}`,("indeterminate"===a||"query"===a)&&"bar2Indeterminate","buffer"===a&&"bar2Buffer"]};return d(o,v,e)})(y),C=i(),x={},S={bar1:{},bar2:{}};if(("determinate"===p||"buffer"===p)&&void 0!==c){x["aria-valuenow"]=Math.round(c),x["aria-valuemin"]=0,x["aria-valuemax"]=100;let r=c-100;C&&(r=-r),S.bar1.transform=`translateX(${r}%)`}if("buffer"===p&&void 0!==m){let r=(m||0)-100;C&&(r=-r),S.bar2.transform=`translateX(${r}%)`}return s.jsxs(I,n({className:u(w.root,l),ownerState:y,role:"progressbar"},x,{ref:e},g,{children:["buffer"===p?s.jsx(L,{className:w.dashed,ownerState:y}):null,s.jsx(M,{className:w.bar1,ownerState:y,style:S.bar1}),"determinate"===p?null:s.jsx(j,{className:w.bar2,ownerState:y,style:S.bar2})]}))});export{z as L};
