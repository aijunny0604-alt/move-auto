/* Drift Setup Atlas v2.0 — deterministic, offline research tools.
 * Recommendations are test hypotheses, never a vehicle dynamics solver.
 * All unknown INI lines are preserved when patching saved VALUE fields. */
(function(root){
'use strict';
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
const num=v=>(v===null||v===undefined||String(v).trim()==='')?null:(Number.isFinite(Number(v))?Number(v):null);
const tidy=v=>Math.round(v*1e8)/1e8;
function parseIni(text){
 const sections=Object.create(null), locations=Object.create(null), errors=[]; let sec='';
 String(text).replace(/^\uFEFF/,'').split(/\r?\n/).forEach((raw,i)=>{
  let l=raw.trim();if(!l||/^(;|#|\/\/)/.test(l))return;
  const h=l.match(/^\[([^\]]+)\]/);if(h){sec=h[1].trim().toUpperCase();if(own(sections,sec))errors.push(`중복 섹션 ${sec} (${i+1}행)`);else sections[sec]=Object.create(null);return;}
  if(!sec||!l.includes('='))return;
  let eq=l.indexOf('='), k=l.slice(0,eq).trim().toUpperCase(),v=l.slice(eq+1).trim();
  v=v.replace(/;.*$/,'').replace(/\s+\/\/.*$/,'').trim();
  if(own(sections[sec],k))errors.push(`중복 키 ${sec}.${k} (${i+1}행)`);
  sections[sec][k]=v; locations[sec+'.'+k]=i+1;
 });return {sections,locations,errors};
}
function values(text){let out=Object.create(null);for(const [s,k] of Object.entries(parseIni(text).sections))if(own(k,'VALUE'))out[s]=num(k.VALUE)??k.VALUE;return out;}
const baseName=s=>String(s).replace(/\\/g,'/').split('/').pop().replace(/\.ini\.txt$/i,'.ini').toLowerCase();
function classify(name,text){
 let b=baseName(name);if(b.endsWith('.acd'))return 'packed';if(b==='setup.ini')return 'ranges';
 let p=parseIni(text).sections;
 if(Object.values(p).some(k=>own(k,'VALUE'))&&(p.CAR||Object.keys(p).some(k=>/^(ARB_|DAMP_|SPRING_|DIFF_)/.test(k))))return 'preset';
 if(/\.(ini|lut|rto)$/i.test(b))return 'data';return 'unsupported';
}
function modelOf(text){return parseIni(text).sections.CAR?.MODEL||'';}
function patch(text,changes){
 const parsed=parseIni(text);if(parsed.errors.length)throw Error('중복 섹션/키가 있어 출력하지 않습니다. '+parsed.errors[0]);
 const old=values(text);for(const [k,v] of Object.entries(changes)){if(!own(old,k)||num(v)===null)throw Error('기존 VALUE가 없는 항목 또는 숫자 오류: '+k);}
 let s='';const seen=new Set();const nl=String(text).includes('\r\n')?'\r\n':'\n';
 const lines=String(text).split(/\r?\n/).map(line=>{
  let h=line.replace(/^\uFEFF/,'').trim().match(/^\[([^\]]+)\]/);if(h){s=h[1].trim().toUpperCase();return line;}
  if(own(changes,s)&&/^\s*VALUE\s*=/i.test(line)){
   seen.add(s);return line.replace(/^(\s*VALUE\s*=\s*)([^;\r\n]*?)(\s*(?:;.*|\s+\/\/.*)?)$/i,(_,prefix,val,end)=>prefix+String(tidy(changes[s]))+end);
  }return line;
 });
 for(const k of Object.keys(changes))if(!seen.has(k))throw Error('VALUE 위치를 찾지 못함: '+k);
 return lines.join(nl);
}
// Only conservative, known monotonic legacy adjustments are writable.
const writable=/^(ARB_(FRONT|REAR)|SPRING_RATE_(LF|RF|LR|RR)|DAMP_(?:FAST_)?(?:BUMP|REBOUND)_(?:LF|RF|LR|RR)|DIFF_(POWER|COAST|PRELOAD)|PRESSURE_(LF|RF|LR|RR)|FRONT_BIAS|BRAKE_POWER_MULT)$/;
function rangeFor(ranges,key,files={}){
 const s=parseIni(ranges).sections, d=s[key];if(!d)return {ok:false,reason:'setup.ini에 조절 정의 없음'};
 if(!writable.test(key))return {ok:false,reason:'단위·인덱스·부호 확인이 필요한 항목: 읽기 전용'};
 if(d.LUT||d.RATIOS||d.CONTROLLER)return {ok:false,reason:'LUT/컨트롤러 기반 항목은 자동 숫자 추천 중지'};
 if(/^DAMP_/.test(key)){
  const sus=parseIni(files['suspensions.ini']?.text||'').sections;
  if(num(sus._EXTENSION?.DAMPER_LUTS)===1||files['dampers.ini'])return {ok:false,reason:'CSP 감쇠 LUT 감지: 클릭 증가가 감쇠 증가인지 미확인'};
 }
 const min=num(d.MIN),max=num(d.MAX),step=num(d.STEP), mode=num(d.SHOW_CLICKS??s.DISPLAY_METHOD?.SHOW_CLICKS);
 if(min===null||max===null||step===null||step<=0||min>max)return {ok:false,reason:'MIN/MAX/STEP 수치가 없거나 잘못됨'};
 if(mode!==0&&mode!==2)return {ok:false,reason:'SHOW_CLICKS '+mode+' 변환은 이 버전에서 자동 지원하지 않음'};
 const n=Math.floor((max-min)/step+1e-7);
 return {ok:true,mode,min:mode===2?0:min,max:mode===2?n:tidy(min+n*step),step:mode===2?1:step,internalMin:min,internalStep:step,definedMax:max};
}
function validValue(v,r){return r.ok&&num(v)!==null&&v>=r.min-1e-7&&v<=r.max+1e-7&&Math.abs((v-r.min)/r.step-Math.round((v-r.min)/r.step))<1e-6;}
function decoded(v,r){return r.ok?(r.mode===2?tidy(r.internalMin+v*r.internalStep):v):null;}
function proposal(project,rule,direction=rule.direction){
 if(!project.current)return {ok:false,reason:'기준 주행 세팅이 없습니다.'};
 if(!project.confirmed)return {ok:false,reason:'setup.ini와 세팅 파일이 같은 차량·버전인지 먼저 확인하세요.'};
 if(!project.ranges)return {ok:false,reason:'setup.ini 조절 범위가 없어 숫자를 만들지 않습니다.'};
 if(!rule.keys?.length)return {ok:false,reason:rule.noNumber||'운전/데이터 확인을 먼저 진행합니다.'};
 const parsed=parseIni(project.current);if(parsed.errors.length)return {ok:false,reason:parsed.errors[0]};
 const data=values(project.current),ch=Object.create(null),details=[];
 for(const key of rule.keys){
  const r=rangeFor(project.ranges,key,project.files||{}),v=num(data[key]);
  if(!r.ok)return {ok:false,reason:key+': '+r.reason};
  if(!validValue(v,r))return {ok:false,reason:key+': 현재 값이 정의된 범위/스텝과 맞지 않음. 원본 대조 필요.'};
  const next=tidy(v+direction*r.step);
  if(!validValue(next,r))return {ok:false,reason:key+': 제안 방향의 조절 한계 도달. 다른 항목으로 자동 대체하지 않음.'};
  ch[key]=next;details.push({key,old:v,next,r,oldInternal:decoded(v,r),newInternal:decoded(next,r)});
 }
 if(details.length>1&&new Set(details.map(x=>x.old)).size>1)return {ok:false,reason:'좌우 값이 다릅니다. 비대칭 원인 확인 전에 동시에 변경하지 않습니다.'};
 return {ok:true,changes:ch,details,text:patch(project.current,ch)};
}
function differences(a,b){const av=values(a),bv=values(b);return [...new Set([...Object.keys(av),...Object.keys(bv)])].filter(k=>String(av[k])!==String(bv[k])).map(key=>({key,a:av[key]??'없음',b:bv[key]??'없음'}));}
function fingerprint(text){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function lut(text){
 const pts=[];for(const l of String(text).split(/\r?\n/)){const m=l.trim().match(/^(-?[\d.eE+]+)\s*\|\s*(-?[\d.eE+]+)(?:\s*(?:;.*)?)$/);if(m&&num(m[1])!==null&&num(m[2])!==null)pts.push([+m[1],+m[2]]);}
 pts.sort((a,b)=>a[0]-b[0]);return pts.filter((p,i)=>i===0||p[0]!==pts[i-1][0]);
}
function interpolate(points,x){if(!points.length||x<points[0][0]||x>points.at(-1)[0])return null;for(let i=0;i<points.length;i++){if(x===points[i][0])return points[i][1];if(points[i][0]>x){const a=points[i-1],b=points[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}}return null;}
function audit(p){
 const fs=p.files||{},get=n=>parseIni(fs[n]?.text||'').sections,car=get('car.ini'),eng=get('engine.ini'),drive=get('drivetrain.ini'),br=get('brakes.ini'),dash=get('digital_instruments.ini'),ai=get('ai.ini');
 const facts=[],warnings=[],missing=[],dependencies=[];
 function fact(file,s,k,label){const v=get(file)[s]?.[k];if(v!==undefined)facts.push({file,field:s+'.'+k,value:v,label});}
 [['car.ini','INFO','SCREEN_NAME','차량 표시명'],['car.ini','BASIC','TOTALMASS','질량 입력값 (kg)'],['car.ini','BASIC','INERTIA','관성 구성 입력 (벡터 원문; kg·m²로 해석 금지)'],['car.ini','CONTROLS','STEER_LOCK','조향 LOCK 입력'],['car.ini','CONTROLS','STEER_RATIO','조향비 입력'],['engine.ini','ENGINE_DATA','LIMITER','엔진 리미터 (RPM)'],['engine.ini','ENGINE_DATA','INERTIA','엔진 관성 입력'],['engine.ini','HEADER','POWER_CURVE','엔진 곡선 참조'],['drivetrain.ini','TRACTION','TYPE','구동 방식'],['drivetrain.ini','GEARS','COUNT','전진 기어 수'],['drivetrain.ini','GEARS','FINAL','물리 파일 기본 종감속 (선택 프리셋 적용 전)'],['drivetrain.ini','CLUTCH','MAX_TORQUE','클러치 허용토크 입력 (엔진 출력 아님)'],['brakes.ini','DATA','FRONT_SHARE','기본 앞 제동 배분'],['ai.ini','GEARS','UP','AI/자동변속 보조 업시프트 RPM']].forEach(x=>fact(...x));
 // Surface actual supplied suspension values without inventing a wheel-rate conversion.
 [['BASIC','WHEELBASE','휠베이스 입력 (m)'],['BASIC','CG_LOCATION','종방향 CG 위치 입력 (높이 아님)'],['ARB','FRONT','기본 앞 ARB 입력'],['ARB','REAR','기본 뒤 ARB 입력']].forEach(([ss,k,l])=>fact('suspensions.ini',ss,k,l));
 for(const side of ['FRONT','REAR'])for(const key of ['TYPE','TRACK','SPRING_RATE','PROGRESSIVE_SPRING_RATE','DAMP_BUMP','DAMP_REBOUND','DAMP_FAST_BUMP','DAMP_FAST_REBOUND','DAMP_FAST_BUMPTHRESHOLD','DAMP_FAST_REBOUNDTHRESHOLD'])fact('suspensions.ini',side,key,(side==='FRONT'?'앞':'뒤')+' 기본 '+key+' (원문; 현재 세팅과 구분)');
 for(let i=1;i<=Math.min(10,num(drive.GEARS?.COUNT)||0);i++)fact('drivetrain.ini','GEARS','GEAR_'+i,i+'단 기본 기어비');
 const main=['suspensions.ini','tyres.ini','car.ini','engine.ini','drivetrain.ini'];for(const n of main)if(!fs[n])missing.push(n);
 const power=eng.HEADER?.POWER_CURVE;if(power&&!power.startsWith('(')&&!fs[baseName(power)])missing.push(power);
 const saved=values(p.current||'');if(own(saved,'FINAL_RATIO'))warnings.push('FINAL_RATIO='+saved.FINAL_RATIO+'는 선택값입니다. drivetrain.ini의 FINAL과 현재 적용 종감속은 같다고 단정하지 않습니다. final.rto와 게임 표시를 대조하세요.');
 const turbos=Object.keys(eng).filter(k=>/^TURBO_\d+$/.test(k));if(turbos.length)facts.push({file:'engine.ini',field:'TURBO_*',value:turbos.join(', '),label:'확인된 터보 정의'});
 for(const n of Object.keys(fs)){const mt=n.match(/^ctrl_turbo(\d+)\.ini$/);if(mt&&!eng['TURBO_'+mt[1]])warnings.push(n+'에 대응하는 TURBO_'+mt[1]+' 정의를 engine.ini에서 찾지 못했습니다. 확장 물리/다른 파일과의 연결 확인 전에는 적용된다고 단정하지 않습니다.');}
 const rpmGraph=Object.values(dash).find(s=>s.TYPE==='RPM_GRAPH');if(rpmGraph?.RPM_MAX){facts.push({file:'digital_instruments.ini',field:'RPM_GRAPH.RPM_MAX',value:rpmGraph.RPM_MAX,label:'계기판 RPM 그래프 상한 (리미터 아님)'});if(num(rpmGraph.RPM_MAX)!==num(eng.ENGINE_DATA?.LIMITER))warnings.push('계기판 RPM 그래프 상한과 엔진 리미터가 다릅니다. 영상 계기판만으로 킥 후 RPM을 추정하지 마세요.');}
 const speed=Object.values(dash).find(s=>s.TYPE==='SPEED');if(speed?.UNITS)facts.push({file:'digital_instruments.ini',field:'TYPE=SPEED.UNITS',value:speed.UNITS,label:'이 모드 계기판 속도 단위'});
 for(const [name,obj] of Object.entries(fs)){
  if(!name.endsWith('.ini'))continue;for(const [section,ks] of Object.entries(get(name)))for(const [key,v] of Object.entries(ks)){
   if(/^[\w.\-/]+\.(lut|rto)$/i.test(v)){if(name==='engine.ini'&&section==='COAST_CURVE'&&eng.HEADER?.COAST_CURVE!=='FROM_FILE')continue;const target=baseName(v);dependencies.push({from:name,field:section+'.'+key,target,present:!!fs[target]});}
  }
 }
 const tyre=get('tyres.ini'), idx=num(saved.TYRES);let points=[];
 if(Object.keys(tyre).length){if(idx===null)warnings.push('타이어 선택 인덱스가 없어 앞뒤 WIDTH를 특정하지 않습니다.');else{const suffix=idx===0?'':'_'+idx;for(const side of ['FRONT','REAR'])for(const key of ['NAME','SHORT_NAME','WIDTH','RADIUS','RATE','FZ0','DX_REF','DY_REF','PRESSURE_IDEAL'])fact('tyres.ini',side+suffix,key,(side==='FRONT'?'앞':'뒤')+' 선택 타이어 '+key+' 원문'+(key==='WIDTH'?' (m)':''));}}
 const curve=power?fs[baseName(power)]:null;if(curve)points=lut(curve.text);
 if(points.length)warnings.push('아래 곡선은 power.lut의 기본 RPM-토크 데이터입니다. 터보/CSP/스로틀/손실 반영 후 최종 실측토크가 아니며, 지연 응답은 포함하지 않습니다.');
 if(p.ranges&&/LUT\s*=/i.test(p.ranges))warnings.push('LUT 기반 세팅이 있습니다. 해당 항목은 숫자 크기만으로 강약을 판단하지 않습니다.');
 if(drive.TRACTION?.TYPE&&drive.TRACTION.TYPE!=='RWD')warnings.push('이 진단 규칙은 RWD 드리프트 중심입니다. '+drive.TRACTION.TYPE+' 차종에는 주행 원리 안내만 제공하고 자동 숫자 추천은 보류하세요.');
 return {facts,warnings,missing:[...new Set(missing)],dependencies,points,driveType:drive.TRACTION?.TYPE||null};
}
function med(xs){xs=xs.filter(Number.isFinite).sort((a,b)=>a-b);if(!xs.length)return null;const i=Math.floor(xs.length/2);return xs.length%2?xs[i]:(xs[i-1]+xs[i])/2;}
function assess(exp){
 const aa=exp.runs.filter(r=>r.group==='A'),bb=exp.runs.filter(r=>r.group==='B'),t=exp.tolerance;
 const summary=rows=>{let o={n:rows.length,spins:rows.filter(r=>r.spin).length};for(const k of ['time','settle','corrections','overshoot','exit','entry','hold','catch','drive','error'])o[k]=med(rows.map(r=>num(r[k])).filter(v=>v!==null));return o;};
 const a=summary(aa),b=summary(bb),notes=[],bad=[],wait=[];
 if(a.n<t.minRuns||b.n<t.minRuns)wait.push(`A/B 각 ${t.minRuns}회 이상 필요 (현재 ${a.n}/${b.n}회).`);
 if(!exp.sameConditions)wait.push('같은 코너·기어·노면·타이어 상태의 비교인지 확인 필요.');
 const keys=['hold','catch','drive','exit','entry',exp.primary];for(const k of [...new Set(keys)]){if(aa.some(r=>num(r[k])===null)||bb.some(r=>num(r[k])===null)||a[k]===null||b[k]===null)wait.push(k+'의 누락값이 있습니다. 빈칸을 0으로 대체하지 않습니다.');}
 if(a.entry!==null&&b.entry!==null&&Math.abs(a.entry-b.entry)>t.entry)wait.push('진입 속도 중앙값 차이가 허용범위를 넘었습니다.');
 if(b.spins>0)bad.push('B에서 스핀 발생: 성공한 주행만으로 채택하지 않습니다.');
 for(const k of ['hold','catch','drive'])if(a[k]!==null&&b[k]!==null&&a[k]-b[k]>t.score)bad.push(k+' 점수가 보호 한계보다 악화됐습니다.');
 if(a.exit!==null&&b.exit!==null&&a.exit-b.exit>t.exit)bad.push('출구 차속이 보호 한계보다 감소했습니다.');
 const dir=exp.primary==='exit'?-1:1;const delta=a[exp.primary]===null||b[exp.primary]===null?null:dir*(a[exp.primary]-b[exp.primary]);
 if(delta!==null&&delta<t.improvement)notes.push('주요 목표의 개선폭이 사전 지정 최소값에 미달합니다.');
 let status=bad.length?'원복 우선':wait.length?'보류':notes.length?'차이 불명확':'재검증 후보';
 return {a,b,status,wait,bad,notes,delta,canAdopt:status==='재검증 후보'};
}
function crc32(a){let c=0xffffffff;for(const b of a){c^=b;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function decode(buf){const a=buf instanceof Uint8Array?buf:new Uint8Array(buf);if(a[0]===255&&a[1]===254)return new TextDecoder('utf-16le').decode(a);try{return new TextDecoder('utf-8',{fatal:true}).decode(a);}catch{return new TextDecoder('euc-kr').decode(a);}}
async function unzip(buffer){
 const a=new Uint8Array(buffer),v=new DataView(a.buffer,a.byteOffset,a.byteLength),size=a.length;let e=-1;
 if(size>30*1024*1024)throw Error('ZIP 30 MiB 제한 초과');
 for(let i=size-22;i>=Math.max(0,size-65557);i--)if(v.getUint32(i,true)===0x06054b50&&i+22+v.getUint16(i+20,true)===size){e=i;break;}
 if(e<0)throw Error('ZIP 중앙 디렉터리가 없습니다.');
 if(v.getUint16(e+4,true)||v.getUint16(e+6,true))throw Error('분할 ZIP 미지원');
 let count=v.getUint16(e+10,true),pos=v.getUint32(e+16,true),total=0,out=[];
 if(count===65535||count>400)throw Error('ZIP64 또는 400개 초과 엔트리 미지원');
 for(let i=0;i<count;i++){
  if(pos+46>size||v.getUint32(pos,true)!==0x02014b50)throw Error('손상된 ZIP 디렉터리');
  const flag=v.getUint16(pos+8,true),method=v.getUint16(pos+10,true),crc=v.getUint32(pos+16,true),cs=v.getUint32(pos+20,true),us=v.getUint32(pos+24,true),nl=v.getUint16(pos+28,true),xl=v.getUint16(pos+30,true),cl=v.getUint16(pos+32,true),off=v.getUint32(pos+42,true);
  if(pos+46+nl+xl+cl>size)throw Error('잘린 ZIP 파일');const name=decode(a.subarray(pos+46,pos+46+nl));pos+=46+nl+xl+cl;
  if(name.endsWith('/')||!/(\.(ini|lut|rto)(\.txt)?)$/i.test(name))continue;
  if(name.replace(/\\/g,'/').split('/').includes('..'))throw Error('상위 경로를 포함하는 ZIP 거부');
  if(flag&1)throw Error('암호화 ZIP 미지원');if(us>2*1024*1024||(total+=us)>20*1024*1024)throw Error('해제 파일 크기 제한 초과');
  if(off+30>size||v.getUint32(off,true)!==0x04034b50)throw Error('손상된 로컬 헤더');const start=off+30+v.getUint16(off+26,true)+v.getUint16(off+28,true);if(start+cs>size)throw Error('손상된 압축 길이');
  let raw;if(method===0)raw=a.slice(start,start+cs);else if(method===8){let ds;try{ds=new DecompressionStream('deflate-raw');}catch{throw Error('이 브라우저는 ZIP 해제를 지원하지 않습니다. ZIP을 풀고 INI 파일을 선택하세요.');}
   const reader=new Blob([a.subarray(start,start+cs)]).stream().pipeThrough(ds).getReader();let chunks=[],n=0;while(true){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>us||n>2*1024*1024){await reader.cancel();throw Error('ZIP 해제 크기 불일치');}chunks.push(value);}raw=new Uint8Array(n);let j=0;for(const x of chunks){raw.set(x,j);j+=x.length;}
  }else throw Error('ZIP 압축 방식 미지원: '+method);
  if(raw.length!==us||crc32(raw)!==crc)throw Error('ZIP CRC/크기 검증 실패: '+name);out.push({name,text:decode(raw)});
 }return out;
}
const api={num,tidy,parseIni,values,baseName,classify,modelOf,patch,rangeFor,validValue,decoded,proposal,differences,fingerprint,lut,interpolate,audit,med,assess,crc32,decode,unzip};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AtlasCore=api;
})(typeof window!=='undefined'?window:globalThis);
