"use strict";

function buildMethodologyPDF(r, organisation){
  const {W,H,M,black,green,pale,panel,rule,page,rect,line,text,para,heading,wrap,gbp,num,finalize}=createPdfDoc();
  const org=(organisation||'').trim();
  const pct=Math.min(100,Math.max(0,r.robotPct||0));
  const oneDp=v=>(Math.round(v*10)/10).toLocaleString('en-GB');
  const price=v=>'£'+v.toFixed(2);
  const hybridEnergy=r.hybridFuel+r.hybridElectric;
  const hybridMaintTotal=r.hybridRobotMaint+(r.backupMowerCost||0)+(r.extraMaint||0);
  const printedOn=new Date().toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});

  function calcRow(c,y,label,formula,figureLines,result){
    text(c,label,M,y,11.4,'F2',green);y+=15;
    y=para(c,formula,M,y,10.3,W-2*M,13.6,'F3',black);y+=2;
    figureLines.forEach(f=>{y=para(c,f,M,y,10.6,W-2*M,13.9,'F1',black);});y+=2;
    rect(c,M,y,W-2*M,20,pale,null);
    text(c,result,M+8,y+5,10.8,'F2',black);
    return y+20+16;
  }

  // PAGE 1
  let c=page(),y=48;
  c.push(`q 70 0 0 70 ${W-M-70} ${H-24-70} cm /Im1 Do Q`);
  text(c,'How the Figures Are Derived',M,y,20,'F2',black);
  y=76;text(c,'A supporting guide to the calculations behind the Robotic Mowing Business Case',M,y,11.2,'F3',black);
  if(org){y=98;text(c,org,M,y,11.3,'F2',green);}
  y=org?122:104;
  text(c,'Maurice McKinley BSc CEng MICE - The Sustainable Golf Course Project',M,y,10.8,'F1',black);
  text(c,'Printed on '+printedOn,W-M,y,9.4,'F3',black,'right');
  y+=38;

  y=heading(c,'Purpose of This Guide',y,13.6);
  y=para(c,'This guide sets out, in plain terms, exactly how each figure in the Robotic Mowing Business Case is calculated from the information entered into the Generator. It is intended as a supporting reference for treasurers, finance colleagues and committees who wish to see, check or challenge the working behind the headline figures.',M,y,10.8,W-2*M,14.2,'F1');y+=14;

  y=heading(c,'What Is Being Compared',y,13.6);
  y=para(c,'The comparison is between two ways of replacing the mower that is currently due for renewal: buying another conventional mower, or buying a robotic mowing system. Only the cost of replacing that one machine is compared. Any other conventional mower the club retains continues to maintain areas outside the robot area either way, so its cost is unaffected by this decision and is excluded from the comparison.',M,y,10.8,W-2*M,14.2,'F1');y+=16;

  y=heading(c,'Step-by-Step Calculation, Using Your Current Figures',y,13.8);
  y=para(c,'Each step below shows the formula used, followed by your own figures put into that formula.',M,y,10.2,W-2*M,13.4,'F3');y+=10;

  y=calcRow(c,y,'1. Robotic mowers required',
    'Area to be mown robotically, divided by the expected practical mowing capacity of one robot, rounded up to a whole number.',
    [num(r.robotArea)+' m² ÷ '+num(r.robotCapacity)+' m²/day, rounded up'],
    '= '+r.robots+' robotic mower'+(r.robots===1?'':'s')+' required');

  y=calcRow(c,y,'2. Annual mowing hours (conventional basis)',
    'Hours needed for one complete cut, multiplied by the number of complete cuts per week, multiplied by the number of mowing weeks per year.',
    [oneDp(r.hoursPerCut)+' hrs × '+r.cutsWeek+' cuts/week × '+r.weeksYear+' weeks/year'],
    '= '+num(r.annualHours)+' hours/year of conventional mowing');

  if(y>640){c=page();y=54;}
  y=calcRow(c,y,'3. Diesel and electricity cost',
    'Conventional: annual mowing hours × diesel used per hour × diesel price. Hybrid: the diesel cost of the hours still mown conventionally, plus electricity for the robots, based on a planning allowance of 1.0 kWh per 1,000 m² mown.',
    ['Conventional: '+num(r.annualHours)+' hrs × '+oneDp(r.dieselUse)+' l/hr × '+price(r.dieselPrice)+'/litre = '+gbp(r.currentFuel),
     'Hybrid diesel: '+num(r.annualHours*(1-pct/100))+' hrs × '+oneDp(r.dieselUse)+' l/hr × '+price(r.dieselPrice)+' = '+gbp(r.hybridFuel),
     'Hybrid electricity: '+num(r.energyUseKWh)+' kWh × '+price(r.electricityPrice)+'/kWh = '+gbp(r.hybridElectric)],
    'Conventional '+gbp(r.currentFuel)+'   |   Hybrid '+gbp(hybridEnergy)+' ('+gbp(r.hybridFuel)+' diesel + '+gbp(r.hybridElectric)+' electricity)');

  if(y>640){c=page();y=54;}
  y=calcRow(c,y,'4. Maintenance and repairs',
    'Conventional: the annual maintenance allowance entered for the machine being replaced. Hybrid: that allowance is exchanged entirely for each robot’s own annual maintenance allowance, plus any retained backup mower cost, plus an allowance for the extra wear on the remaining conventional mower(s) that now cover the cutting the robot doesn’t do — the machine being replaced no longer exists, so none of its own maintenance allowance carries over.',
    ['Conventional: '+gbp(r.mowerMaint)+' entered directly',
     'Robot maintenance: '+r.robots+' × '+gbp(r.robotMaint)+'/robot = '+gbp(r.hybridRobotMaint)]
     .concat(r.backupMowerCost?['Backup mower: '+gbp(r.backupMowerCost)]:[])
     .concat(r.extraMaint?['Extra maintenance on remaining mower(s): '+gbp(r.extraMaint)]:[]),
    'Conventional '+gbp(r.mowerMaint)+'   |   Hybrid '+gbp(hybridMaintTotal));

  y=calcRow(c,y,'5. New machine investment, annualised',
    'The one-off purchase cost of whichever machine is bought — a new conventional mower, or the robotic system — is spread evenly over its own expected working life. This works like a simple straight-line depreciation allowance, so a one-off capital cost can be compared fairly against the ongoing annual running costs above.',
    ['Conventional: '+gbp(r.mowerCost)+' ÷ '+r.mowerLifeYears+' years = '+gbp(r.currentCapital)+'/year',
     'Robot system: '+gbp(r.systemCost)+' ('+r.robots+' × '+gbp(r.robotCost)+') ÷ '+r.robotLifeYears+' years = '+gbp(r.hybridRobotCapital)+'/year'],
    'Conventional '+gbp(r.currentCapital)+'/year   |   Hybrid '+gbp(r.hybridRobotCapital)+'/year');

  if(y>600){c=page();y=54;}
  y=calcRow(c,y,'6. Total annual cash cost',
    'The sum of the three rows above: diesel/electricity, maintenance and repairs, and the annualised investment cost.',
    ['Conventional: '+gbp(r.currentFuel)+' + '+gbp(r.mowerMaint)+' + '+gbp(r.currentCapital)+' = '+gbp(r.currentTotal),
     'Hybrid: '+gbp(hybridEnergy)+' + '+gbp(hybridMaintTotal)+' + '+gbp(r.hybridRobotCapital)+' = '+gbp(r.hybridTotal)],
    'Conventional '+gbp(r.currentTotal)+'/year   |   Hybrid '+gbp(r.hybridTotal)+'/year');

  if(y>640){c=page();y=54;}
  y=calcRow(c,y,'7. Annual cash saving',
    'Conventional total annual cash cost, minus hybrid total annual cash cost. A negative figure means the hybrid strategy costs more in cash terms.',
    [gbp(r.currentTotal)+' - '+gbp(r.hybridTotal)],
    (r.saving>=0?'Annual cash saving: ':'Additional annual cash cost: ')+gbp(Math.abs(r.saving))+'/year');

  if(y>620){c=page();y=54;}else y+=4;
  y=heading(c,'Greenkeeper Capacity Released (Not a Cash Figure)',y,13.6);
  y=para(c,'Transferring mowing to robots frees up greenkeeper time, less the extra time needed to supervise, clean and maintain the robots. Employment costs are assumed to stay unchanged, so this capacity is shown separately as an indicative value — it is not included in the cash saving above, because it represents time that can be redirected to other work, not a reduction in spend.',M,y,10.6,W-2*M,13.9,'F1');y+=10;
  const capFigures=['Hours freed: '+num(r.annualHours)+' hrs × '+pct+'% = '+num(r.mowingHoursAvoided)+' hrs',
    'Less supervision: '+oneDp(r.supervision)+' hrs/week × '+r.weeksYear+' weeks = '+num(r.supervisionHours)+' hrs',
    'Capacity released: '+num(r.mowingHoursAvoided)+' - '+num(r.supervisionHours)+' = '+num(r.extraHours)+' hrs/year'];
  capFigures.forEach(f=>{y=para(c,f,M,y,10.6,W-2*M,13.9,'F1');});y+=6;
  rect(c,M,y,W-2*M,20,pale,null);
  text(c,'Indicative value: '+num(r.extraHours)+' hrs × '+price(r.staffCost)+'/hr = '+gbp(r.extraValue)+'/year (capacity, not cash saved)',M+8,y+5,10.5,'F2',black);
  y+=36;

  if(y>580){c=page();y=54;}
  y=heading(c,'Key Assumptions Used (All Editable in the Generator)',y,13.6);
  const assumptions=[
    ['Mowing weeks per year',r.weeksYear+' weeks/year'],
    ['Average greenkeeper hourly cost',price(r.staffCost)+'/hour'],
    ['Diesel price',price(r.dieselPrice)+'/litre'],
    ['Electricity price',price(r.electricityPrice)+'/kWh'],
    ['Annual maintenance per robot',gbp(r.robotMaint)+'/robot/year'],
    ['Extra maintenance on remaining mower(s)',gbp(r.extraMaint)+'/year'],
    ['Robot supervision and routine attention',oneDp(r.supervision)+' hrs/week'],
    ['Expected working life, conventional mower',r.mowerLifeYears+' years'],
    ['Expected working life, robotic mower',r.robotLifeYears+' years']
  ];
  const halfW=(W-2*M-16)/2;
  assumptions.forEach((a,i)=>{
    const col=i%2,row=Math.floor(i/2);
    const x=M+col*(halfW+16),ry=y+row*20;
    text(c,a[0]+':',x,ry,9.8,'F1',black);
    text(c,a[1],x+halfW,ry,9.8,'F2',black,'right');
  });
  y+=Math.ceil(assumptions.length/2)*20+16;

  if(y>560){c=page();y=54;}
  y=heading(c,'What Is Deliberately Left Out',y,13.6);
  const exclusions=['The cost of finance or interest on the capital purchase','Any residual or resale value at the end of a machine’s working life','Inflation or future changes in fuel, electricity or labour costs','Any other conventional mower the club retains, since it is unaffected either way','A reduction in greenkeeper employment cost — only the redirection of capacity is shown, never a headcount or salary saving'];
  exclusions.forEach(x0=>{text(c,'•',M+20,y,10.6,'F1',black);y=para(c,x0,M+36,y,10.3,W-2*M-36,13.4,'F1');y+=3;});

  if(y>700){c=page();y=54;}
  const fy=y+18;
  line(c,M,fy-12,W-M,fy-12,rule,.6);
  text(c,'Maurice McKinley BSc CEng MICE',M+6,fy,9.6,'F2',green);
  text(c,'The Sustainable Golf Course Project',M+6,fy+15,9.0,'F1',black);
  const contactX=M+300;
  text(c,'Email: mckinley77@gmail.com',contactX,fy,8.8,'F1',black);
  text(c,'Tel: +44 7544 096463',contactX,fy+15,8.8,'F1',black);
  text(c,'Website: www.mmck.solutions',contactX,fy+30,8.8,'F1',black);

  return finalize('How the Figures Are Derived'+(org?' - '+org:''));
}
