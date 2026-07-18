"use strict";

function buildBusinessCasePDF(r, organisation){
  const {W,H,M,black,green,pale,panel,rule,page,rect,line,text,para,heading,wrap,gbp,num,finalize}=createPdfDoc();
  const org=(organisation||'').trim();
  const savingValue=gbp(Math.abs(r.saving));
  const printedOn=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});

  // PAGE 1 - closely follows the approved Writer design.
  let c=page(),y=48;
  c.push(`q 88 0 0 88 ${W-M-88} ${H-24-88} cm /Im1 Do Q`);
  text(c,'Robotic Mowing Business Case',M,y,21.5,'F2',black);
  y=82;text(c,'An independent assessment of conventional and hybrid robotic mowing',M,y,11.6,'F3',black);
  if(org){y=105;text(c,org,M,y,11.7,'F2',green);}
  y=org?132:111;
  text(c,'Maurice McKinley BSc CEng MICE - The Sustainable Golf Course Project',M,y,11.2,'F1',black);
  text(c,'Printed on '+printedOn,W-M,y,9.6,'F3',black,'right');
  y+=47;
  y=heading(c,'Executive Summary',y,14.6);
  y=para(c,'This assessment compares the annual cash costs and operational benefits of replacing part or all of conventional mowing with robotic mowing.',M,y,11.6,W-2*M,15.4,'F1');y+=7;
  const out=r.saving>=0?'Using the information entered into the Generator, robotic mowing is expected to reduce annual operating costs while releasing significant greenkeeper capacity for improvement work.':'Using the information entered into the Generator, robotic mowing has a higher annual cash cost while still releasing significant greenkeeper capacity for improvement work.';
  y=para(c,out,M,y,11.6,W-2*M,15.4,'F1');y+=7;
  y=para(c,'The direct annual cash saving is only one part of the business case. For many organisations, the greatest long-term benefits are likely to come from reduced winter damage, an extended effective playing or operating season, reduced soil compaction and the opportunity to redirect skilled staff capacity towards drainage improvements, tree and woodland management, irrigation improvements and enhanced presentation.',M,y,11.6,W-2*M,15.4,'F1');y+=15;
  y=heading(c,'Summary of Results',y,14.4);
  const gap=6,cw=(W-2*M-gap*4)/5,ch=76;
  const cards=[
    [['ROBOTIC','MOWERS'],String(r.robots)],
    [['SYSTEM COST'],gbp(r.systemCost)],
    [[r.saving>=0?'ANNUAL CASH':'ADDITIONAL CASH',r.saving>=0?'SAVING':'COST'],savingValue],
    [['GREENKEEPER','CAPACITY'],'+'+num(r.extraHours)+' hrs/year'],
    [['ANNUAL VALUE *'],gbp(r.extraValue)]
  ];
  cards.forEach((d,i)=>{const x=M+i*(cw+gap);rect(c,x,y,cw,ch,panel,rule,.6);line(c,x,y+49,x+cw,y+49,rule,.5);d[0].forEach((q,j)=>text(c,q,x+cw/2,y+9+j*10,7.5,'F2',black,'center'));text(c,d[1],x+cw/2,y+57,10.8,'F2',black,'center');});
  y+=ch+14;
  y=para(c,'* The Annual Value represents the estimated value of greenkeeper capacity released for improvement work. It is shown separately and is not included in the Annual Cash Saving.',M,y,9.6,W-2*M,12.3,'F3',black);y+=22;
  const realValueText1='For many golf clubs, the greatest long-term value of robotic mowing comes from using lightweight machines that can continue working when heavy ride-on mowers would risk causing soil compaction, rutting and turf damage. This can reduce winter damage, improve turf quality, minimise course closures and extend both the effective cutting season and the playing season.';
  const realValueText2='A further important benefit is the release of skilled greenkeeper capacity. Time previously spent on routine mowing can be redirected towards drainage improvements, tree and woodland management, irrigation maintenance, bunker improvements and presentation, creating lasting improvements to the course.';
  const realValueSize=11.1,realValueLeading=14.6,realValueMaxW=W-2*M-20,realValueGap=8;
  const realValueLines1=wrap(realValueText1,realValueSize,realValueMaxW,'F1').length;
  const realValueLines2=wrap(realValueText2,realValueSize,realValueMaxW,'F1').length;
  const boxY=y,boxH=67+(realValueLines1+realValueLines2)*realValueLeading+realValueGap+16;
  rect(c,M,boxY,W-2*M,boxH,pale,null);
  text(c,'The Real Value of Robotic Mowing',M+10,boxY+15,13.8,'F4',green);
  text(c,'The Annual Cash Saving is only part of the business case.',M+10,boxY+40,11.1,'F3',black);
  const realValueY2=para(c,realValueText1,M+10,boxY+67,realValueSize,realValueMaxW,realValueLeading,'F1',black)+realValueGap;
  para(c,realValueText2,M+10,realValueY2,realValueSize,realValueMaxW,realValueLeading,'F1',black);

  // PAGE 2
  c=page();y=54;
  y=heading(c,'Benefits Not Included in the Annual Cash Cost Comparison',y,14.6);
  y=para(c,'The Generator compares only those annual cash costs that can be estimated with reasonable confidence. Several potentially significant benefits have not been assigned a financial value because they vary from site to site.',M,y,11.6,W-2*M,15.4,'F1');y+=8;
  y=para(c,'For many organisations, these wider operational benefits may ultimately prove more valuable than the direct annual cash saving itself. These may include:',M,y,11.6,W-2*M,15.4,'F1');y+=8;
  const benefits=['Improved winter playability and presentation','Extended effective playing or operating season','Reduced soil compaction, rutting and winter damage','Ability to maintain selected areas during prolonged wet weather when conventional mowing may be impractical','Better grass control entering the main growing season','Additional skilled staff capacity for improvement work','Improved member, customer or visitor satisfaction','Reduced diesel consumption and associated emissions'];
  benefits.forEach(b=>{text(c,'•',M+20,y,11.2,'F1',black);y=para(c,b,M+36,y,11.1,W-2*M-36,14.3,'F1');y+=2;});
  y+=12;y=heading(c,'Annual Cash Cost Comparison',y,14.2);
  y=para(c,'In most cases, the proposed solution is a hybrid mowing strategy in which robotic mowers are used on selected areas while conventional mowing is retained where appropriate.',M,y,9.5,W-2*M,11.6,'F1',black);y+=13;
  const tx=M,tw=W-2*M,c1=tw*.50,c2=tw*.25,rowH=28;
  text(c,'Annual Cash Costs',tx+2,y,11.3,'F4',black);
  text(c,'Conventional',tx+c1+c2-5,y,11.3,'F4',black,'right');
  text(c,'Hybrid Robotic',tx+tw-5,y,11.3,'F4',black,'right');y+=24;
  const rows=[
    ['Fuel / Electricity',gbp(r.currentFuel),gbp(r.hybridFuel+r.hybridElectric)],
    ['Maintenance & Repairs',gbp(r.currentMaint),gbp(r.hybridRobotMaint+(r.backupMowerCost||0)+(r.extraMaint||0))],
    ['New Machine Investment (Annualised)',gbp(r.currentCapital),gbp(r.hybridRobotCapital)],
    ['Total Annual Cash Cost',gbp(r.currentTotal),gbp(r.hybridTotal)]
  ];
  rows.forEach((d,i)=>{const bold=i===rows.length-1;text(c,d[0],tx+2,y+5,11.3,bold?'F4':'F1',black);text(c,d[1],tx+c1+c2-5,y+5,11.3,bold?'F4':'F1',black,'right');text(c,d[2],tx+tw-5,y+5,11.3,bold?'F4':'F1',black,'right');y+=rowH;});
  rect(c,tx,y,tw,29,pale,null);text(c,r.saving>=0?'Annual Cash Saving':'Additional Annual Cash Cost',tx+2,y+6,11.3,'F4',black);text(c,savingValue,tx+tw-5,y+6,11.3,'F4',black,'right');y+=25;
  const assessP1='The direct annual cash saving is only one measure of value. For many organisations, the wider operational benefits of robotic mowing are likely to make an even greater contribution to long-term performance, sustainability and playability.';
  const assessP2="Based on the information entered into the Generator, a hybrid robotic mowing strategy appears to offer worthwhile financial and operational benefits and merits serious consideration whenever conventional mowing equipment is due for replacement. Final investment decisions should take account of local conditions, supplier quotations and the organisation\'s wider strategic objectives.";
  const assessSize=11.0,assessLeading=14.3,assessMaxW=W-2*M-14;
  const assessP1Lines=wrap(assessP1,assessSize,assessMaxW,'F1').length;
  const assessP2Lines=wrap(assessP2,assessSize,assessMaxW,'F1').length;
  const assessY=y,assessH=37+assessP1Lines*assessLeading+8+assessP2Lines*assessLeading+16;
  rect(c,M,assessY,W-2*M,assessH,pale,null);
  text(c,'Overall Assessment',M+5,assessY+14,13.8,'F4',green);
  let ay=assessY+37;
  ay=para(c,assessP1,M+7,ay,assessSize,assessMaxW,assessLeading,'F1');ay+=8;
  para(c,assessP2,M+7,ay,assessSize,assessMaxW,assessLeading,'F1');
  const fy=720;
  line(c,M,fy-12,W-M,fy-12,rule,.6);
  text(c,'Maurice McKinley BSc CEng MICE',M+6,fy,9.8,'F2',green);
  text(c,'The Sustainable Golf Course Project',M+6,fy+16,9.2,'F1',black);
  const contactX=M+306;
  text(c,'Email: mckinley77@gmail.com',contactX,fy,9.0,'F1',black);
  text(c,'Tel: +44 7544 096463',contactX,fy+16,9.0,'F1',black);
  text(c,'Website: www.mmck.solutions',contactX,fy+32,9.0,'F1',black);

  return finalize('Robotic Mowing Business Case'+(org?' - '+org:''));
}
