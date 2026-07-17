"use strict";
(() => {
  const ids=["organisation","courseArea","robotPct","hoursPerCut","cutsWeek","weeksYear","staffCost","mowerCost","dieselUse","dieselPrice","mowerMaint","robotCost","robotCapacity","electricityPrice","robotMaint","supervision","backupMowerCost","mowerLife","robotLife"];
  const defaults={};
  ids.forEach(id=>{const el=document.getElementById(id); if(el) defaults[id]=el.value;});
  const n=id=>parseFloat(document.getElementById(id)?.value)||0;
  const gbp=v=>(v<0?"−£":"£")+Math.abs(Math.round(v)).toLocaleString("en-GB");
  const num=v=>Math.round(v).toLocaleString("en-GB");
  const setText=(id,value)=>{const el=document.getElementById(id); if(el) el.textContent=value;};

  function recalc(){
    const area=n("courseArea"), pct=Math.min(100,Math.max(0,n("robotPct")))/100;
    const robotArea=area*pct;
    const robots=robotArea<=0?0:Math.ceil(robotArea/Math.max(1,n("robotCapacity")));
    const annualHours=n("hoursPerCut")*n("cutsWeek")*n("weeksYear");
    const mowingHoursAvoided=annualHours*pct;
    const supervisionHours=n("supervision")*n("weeksYear");
    const extraHours=Math.max(0,mowingHoursAvoided-supervisionHours);
    const extraValue=extraHours*n("staffCost");
    const currentFuel=annualHours*n("dieselUse")*n("dieselPrice");
    const hybridFuel=annualHours*(1-pct)*n("dieselUse")*n("dieselPrice");
    const annualRobotAreaMown=robotArea*n("cutsWeek")*n("weeksYear");
    const energyUseKWh=annualRobotAreaMown/1000;
    const hybridElectric=energyUseKWh*n("electricityPrice");
    const currentMaint=n("mowerMaint");
    const hybridMowerMaint=currentMaint*(1-pct);
    const hybridRobotMaint=robots*n("robotMaint");
    const backupMowerCost=n("backupMowerCost");
    const systemCost=robots*n("robotCost");
    const mowerLifeYears=Math.max(1,n("mowerLife"));
    const robotLifeYears=Math.max(1,n("robotLife"));
    const currentCapital=n("mowerCost")/mowerLifeYears;
    const hybridRobotCapital=systemCost/robotLifeYears;
    const currentTotal=currentFuel+currentMaint+currentCapital;
    const hybridTotal=hybridFuel+hybridElectric+hybridMowerMaint+hybridRobotMaint+backupMowerCost+hybridRobotCapital;
    const saving=currentTotal-hybridTotal;

    setText("robotArea","(= "+num(robotArea)+" m²)");
    setText("kRobots",robots);
    setText("kSystem",gbp(systemCost));
    setText("kSaving",gbp(saving));
    setText("kHours",num(extraHours)+" hrs");
    setText("kValue",gbp(extraValue));
    setText("cEnergy",gbp(currentFuel));
    setText("hEnergy",gbp(hybridFuel+hybridElectric));
    setText("cMaint",gbp(currentMaint));
    setText("hMaint",gbp(hybridMowerMaint+hybridRobotMaint+backupMowerCost));
    setText("cCapital",gbp(currentCapital));
    setText("hCapital",gbp(hybridRobotCapital));
    setText("cTotal",gbp(currentTotal));
    setText("hTotal",gbp(hybridTotal));
    setText("saving",gbp(saving));
    setText("capMower",gbp(n("mowerCost")));
    setText("capRobot",gbp(systemCost));
    document.getElementById("kSaving")?.classList.toggle("negative",saving<0);
    document.getElementById("saving")?.classList.toggle("negative",saving<0);

    window.latestReportData={robots,systemCost,saving,extraHours,extraValue,currentFuel,hybridFuel,hybridElectric,currentMaint,hybridMowerMaint,hybridRobotMaint,currentCapital,hybridRobotCapital,currentTotal,hybridTotal,robotArea,energyUseKWh,backupMowerCost};
  }

  function status(message,error=false){
    const el=document.getElementById("pdfStatus"); if(!el) return;
    el.textContent=message; el.style.color=error?"#a13b2d":"#183d27";
  }
  function makePdf(){
    recalc();
    const organisation=(document.getElementById("organisation")?.value||"").trim();
    const bytes=buildBusinessCasePDF(window.latestReportData,organisation);
    return {blob:new Blob([bytes],{type:"application/pdf"}),organisation};
  }
  function downloadPdf(){
    try{
      status("Creating PDF…");
      const {blob,organisation}=makePdf();
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      const safe=organisation.replace(/[^a-z0-9]+/gi,"_").replace(/^_+|_+$/g,"");
      a.href=url; a.download=`Robotic_Mowing_Business_Case_${safe||"Report"}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),5000);
      status("PDF downloaded");
    }catch(e){console.error(e);status("PDF could not be created",true);alert("The PDF could not be created: "+e.message);}
  }
  function openPdf(){
    try{
      // Open a blank tab synchronously so popup blockers do not reject it.
      const tab=window.open("about:blank","_blank");
      if(!tab) throw new Error("The browser blocked the new tab. Please allow pop-ups for this file.");
      status("Creating PDF…");
      const {blob}=makePdf();
      const url=URL.createObjectURL(blob);
      tab.location.href=url;
      setTimeout(()=>URL.revokeObjectURL(url),120000);
      status("PDF opened — use the PDF viewer’s Print button");
    }catch(e){console.error(e);status("PDF could not be opened",true);alert(e.message);}
  }

  function updateStickyOffset(){
    const header=document.querySelector(".sticky-header");
    if(header) document.documentElement.style.setProperty("--sticky-offset",header.offsetHeight+"px");
  }
  window.addEventListener("resize",updateStickyOffset);
  window.addEventListener("orientationchange",updateStickyOffset);
  updateStickyOffset();

  ids.forEach(id=>document.getElementById(id)?.addEventListener("input",recalc));
  document.getElementById("pdfBtn")?.addEventListener("click",downloadPdf);
  document.getElementById("printPdfBtn")?.addEventListener("click",openPdf);
  document.getElementById("resetBtn")?.addEventListener("click",()=>{ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=defaults[id]??"";});recalc();status("");});
  recalc();
})();
