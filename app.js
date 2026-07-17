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

    window.latestReportData={robots,systemCost,saving,extraHours,extraValue,currentFuel,hybridFuel,hybridElectric,currentMaint,hybridMowerMaint,hybridRobotMaint,currentCapital,hybridRobotCapital,currentTotal,hybridTotal,robotArea,energyUseKWh,backupMowerCost,
      area,robotPct:n("robotPct"),robotCapacity:n("robotCapacity"),hoursPerCut:n("hoursPerCut"),cutsWeek:n("cutsWeek"),weeksYear:n("weeksYear"),annualHours,mowingHoursAvoided,supervisionHours,supervision:n("supervision"),staffCost:n("staffCost"),
      dieselUse:n("dieselUse"),dieselPrice:n("dieselPrice"),electricityPrice:n("electricityPrice"),mowerMaint:n("mowerMaint"),robotMaint:n("robotMaint"),mowerCost:n("mowerCost"),robotCost:n("robotCost"),mowerLifeYears,robotLifeYears};
  }

  function status(message,error=false){
    const el=document.getElementById("pdfStatus"); if(!el) return;
    el.textContent=message; el.style.color=error?"#a13b2d":"#183d27";
  }
  function makePdf(builder,filenamePrefix){
    recalc();
    const organisation=(document.getElementById("organisation")?.value||"").trim();
    const bytes=builder(window.latestReportData,organisation);
    const safe=organisation.replace(/[^a-z0-9]+/gi,"_").replace(/^_+|_+$/g,"");
    const filename=`${filenamePrefix}_${safe||"Report"}.pdf`;
    return {file:new File([bytes],filename,{type:"application/pdf"}),filename};
  }
  // Mobile Safari/Chrome often ignore the <a download> filename — and the
  // "open in a new tab" trick — for blob: PDFs, giving a generic or
  // random filename instead. The native share sheet's Save/Print actions
  // use the real filename we give it here, so it's tried first.
  async function tryShare(file,successMessage){
    if(!navigator.canShare?.({files:[file]}))return false;
    try{
      await navigator.share({files:[file]});
      status(successMessage);
    }catch(e){
      if(e.name!=="AbortError")throw e;
      status("");
    }
    return true;
  }
  function bytesToBase64(bytes){
    let binary="";
    const chunk=0x8000;
    for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode.apply(null,bytes.subarray(i,i+chunk));
    return btoa(binary);
  }
  async function downloadPdf(builder,filenamePrefix){
    try{
      status("Creating PDF…");
      const {file,filename}=makePdf(builder,filenamePrefix);
      if(await tryShare(file,"PDF ready — choose Save to Files or Print from the share sheet"))return;
      // Safari has a long-standing bug where it ignores the download
      // attribute's filename for blob: URLs specifically, inventing a
      // random one instead. A self-contained data: URI sidesteps it.
      const bytes=new Uint8Array(await file.arrayBuffer());
      const a=document.createElement("a");
      a.href=`data:application/pdf;base64,${bytesToBase64(bytes)}`;
      a.download=filename;
      document.body.appendChild(a); a.click(); a.remove();
      status("PDF downloaded");
    }catch(e){console.error(e);status("PDF could not be created",true);alert("The PDF could not be created: "+e.message);}
  }
  const header=document.querySelector(".sticky-header");
  const TOP_THRESHOLD=4;

  function updateStickyOffset(){
    if(header) document.documentElement.style.setProperty("--sticky-offset",header.offsetHeight+"px");
  }
  function collapseHero(){
    if(!header || header.classList.contains("is-collapsed")) return;
    header.classList.add("is-collapsed");
  }
  function expandHero(){
    if(!header || !header.classList.contains("is-collapsed")) return;
    header.classList.remove("is-collapsed");
  }

  if(header){
    // The KPI summary stays pinned at all times; only the title/hero
    // block above it collapses once scrolled, and only expands again
    // once the page is back at the very top.
    let ticking=false;
    function onScroll(){
      const y=Math.max(0,window.scrollY);
      if(y<=TOP_THRESHOLD) expandHero(); else collapseHero();
      updateStickyOffset();
      ticking=false;
    }
    window.addEventListener("scroll",()=>{
      if(!ticking){requestAnimationFrame(onScroll);ticking=true;}
    },{passive:true});
    header.addEventListener("transitionend",updateStickyOffset);

    // Keep focused fields clear of the header: collapse the hero
    // immediately, then re-check once the on-screen keyboard has
    // finished resizing the viewport.
    document.addEventListener("focusin",e=>{
      if(!e.target.matches("input,textarea")) return;
      collapseHero();
      requestAnimationFrame(()=>e.target.scrollIntoView({block:"center"}));
      setTimeout(()=>e.target.scrollIntoView({block:"center"}),300);
    });

    // On-screen keyboards on mobile shrink/scroll the *visual* viewport
    // while position:sticky tracks the *layout* viewport, so the pinned
    // header can end up rendered above the visible screen. Re-anchor it
    // to whatever the visual viewport is actually showing.
    if(window.visualViewport){
      const vv=window.visualViewport;
      function syncViewportOffset(){
        header.style.transform=vv.offsetTop?`translateY(${vv.offsetTop}px)`:"";
      }
      vv.addEventListener("resize",syncViewportOffset);
      vv.addEventListener("scroll",syncViewportOffset);
    }
  }

  window.addEventListener("resize",updateStickyOffset);
  window.addEventListener("orientationchange",updateStickyOffset);
  window.visualViewport?.addEventListener("resize",updateStickyOffset);
  updateStickyOffset();

  ids.forEach(id=>document.getElementById(id)?.addEventListener("input",recalc));
  document.getElementById("pdfBtn")?.addEventListener("click",()=>downloadPdf(buildBusinessCasePDF,"Robotic_Mowing_Business_Case"));
  document.getElementById("explainerPdfBtn")?.addEventListener("click",()=>downloadPdf(buildMethodologyPDF,"How_the_Figures_Are_Derived"));
  document.getElementById("resetBtn")?.addEventListener("click",()=>{ids.forEach(id=>{const el=document.getElementById(id);if(el)el.value=defaults[id]??"";});recalc();status("");});
  recalc();
})();
