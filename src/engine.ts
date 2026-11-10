export const names=['Nhận hàng','Cất hàng','Soạn hàng','Đóng gói','Xuất hàng'];
export const plans=[{name:'PA0',staff:[21,26,35,22,13],times:[3,4,6,4,2],cvA:1.6,cvS:1.2,extra:0,ct:23.59,wip:125.79},{name:'PA1',staff:[21,26,35,22,13],times:[3,4,6,3.8,2],cvA:1.1,cvS:1,extra:40000,ct:14.85,wip:79.2},{name:'PA2',staff:[20,26,38,25,13],times:[3,4,6,3.8,2],cvA:1.1,cvS:1,extra:40000,ct:12.7,wip:67.72},{name:'PA3',staff:[19,25,38,24,13],times:[3,4,6,4,2],cvA:1.6,cvS:1.2,extra:0,ct:14.12,wip:75.33}];
export type Config=typeof plans[number]&{demand:number;scenario:string;hours:number;flash:number;base:number;seed:number;random:boolean;dbr:boolean;replenish:number};
export const defaults=():Config=>({...structuredClone(plans[0]),demand:320,scenario:'peak',hours:8,flash:3,base:320,seed:42,random:true,dbr:false,replenish:80});
export const capacity=(c:Config)=>c.staff.map((n,i)=>60*n/c.times[i]);
export type Job={id:number;arrival:number;group:string;stage:number;start:number;end:number;remaining:number;deadline:number;status:'chờ'|'xử lý'|'xong';replenishment:boolean};
export class Engine{
 c:Config;t=0;seed:number;jobs:Job[]=[];queues:Job[][]=[[],[],[],[],[]];active:Job[][]=[[],[],[],[],[]];held:Job[]=[];done:Job[]=[];stock=0;next=0;nextSupply=0;busy=[0,0,0,0,0];work=0;history:any[]=[];lastSample=-1;
 constructor(c:Config){this.c=structuredClone(c);this.seed=c.seed;if(c.scenario==='days')for(let i=0;i<400;i++)this.add(false,-720);}
 rand(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return (this.seed+.5)/4294967296;}
 duration(mean:number,cv:number){if(!this.c.random||cv===0)return mean;const z=Math.sqrt(-2*Math.log(this.rand()))*Math.cos(2*Math.PI*this.rand());const variance=Math.log(1+cv*cv);return Math.max(.001,mean*Math.exp(Math.sqrt(variance)*z-variance/2));}
 get open(){return this.c.scenario!=='days'||this.t%1440<480;}
 get rate(){return this.c.scenario==='flash'?(this.t<this.c.flash*60?420:this.c.base):this.c.demand;}
 get limit(){return this.c.scenario==='days'?4320:this.c.hours*60;}
 add(supply:boolean,arrival=this.t){const j:Job={id:this.jobs.length+1,arrival,group:['A','B','C'][this.jobs.length%3],stage:supply?0:2,start:-1,end:-1,remaining:0,deadline:arrival+1440,status:'chờ',replenishment:supply};this.jobs.push(j);if(!supply&&this.c.dbr)this.held.push(j);else this.queues[j.stage].push(j);}
 step(minutes=1){const target=Math.min(this.limit,this.t+minutes);while(this.t<target-1e-8){const dt=Math.min(.1,target-this.t,480-this.t%1440>0?480-this.t%1440:.1);if(this.open){this.work+=dt;this.next-=dt;this.nextSupply-=dt;if(this.rate>0)while(this.next<=0){this.add(false);this.next+=this.duration(60/this.rate,this.c.cvA);}else this.next=0;if(this.c.replenish>0)while(this.nextSupply<=0){this.add(true);this.nextSupply+=60/this.c.replenish;}
 for(let s=4;s>=0;s--){this.busy[s]+=this.active[s].length*dt;this.active[s]=this.active[s].filter(j=>{j.remaining-=dt;if(j.remaining>1e-8)return true;j.end=this.t+dt;if(s===4||s===1){j.status='xong';if(s===4)this.done.push(j);else this.stock++;}else{j.stage++;j.status='chờ';this.queues[j.stage].push(j);}return false;});}
 // Rope limits released unfinished orders to a 15-minute buffer plus occupied servers.
 const drum=capacity(this.c).slice(2).indexOf(Math.min(...capacity(this.c).slice(2)))+2;
 const allowance=Math.ceil(capacity(this.c)[drum]/4)+this.c.staff.slice(2).reduce((a,b)=>a+b,0);
 while(this.held.length&&(!this.c.dbr||this.queues.slice(2).flat().length+this.active.slice(2).flat().length<allowance))this.queues[2].push(this.held.shift()!);
 for(let s=0;s<5;s++)while(this.queues[s].length&&this.active[s].length<this.c.staff[s]){const j=this.queues[s].shift()!;j.status='xử lý';j.start=this.t+dt;j.remaining=this.duration(this.c.times[s],this.c.cvS);this.active[s].push(j);}}
 this.t=Math.round((this.t+dt)*1e8)/1e8;if(Math.floor(this.t/60)>this.lastSample){this.lastSample=Math.floor(this.t/60);this.history.push(this.snapshot());}}
 }
 snapshot(){const orders=this.jobs.filter(j=>!j.replenishment),wip=orders.length-this.done.length;return {hour:+(this.t/60).toFixed(2),received:orders.length,done:this.done.length,wip,backlog:wip,picking:this.queues[2].length,packing:this.queues[3].length,outbound:this.queues[4].length,throughput:this.work?this.done.length*60/this.work:0,ct:this.done.length?this.done.reduce((a,j)=>a+j.end-j.arrival,0)/this.done.length:0,sla:this.done.length?100*this.done.filter(j=>j.end<=j.deadline).length/this.done.length:0,overdue:orders.filter(j=>j.status!=='xong'&&this.t>j.deadline).length};}
}
