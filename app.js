"use strict";
(() => {
  const ids=["organisation","courseArea","robotPct","hoursPerCut","cutsWeek","weeksYear","staffCost","mowerCost","dieselUse","dieselPrice","mowerMaint","robotCost","robotCapacity","electricityPrice","robotMaint","supervision","backupMowerCost","extraMaint","mowerLife","robotLife"];
  const defaults={};
  ids.forEach(id=>{const el=document.getElementById(id); if(el) defaults[id]=el.defaultValue;});
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
    const hybridRobotMaint=robots*n("robotMaint");
    const backupMowerCost=n("backupMowerCost");
    const extraMaint=n("extraMaint");
    const systemCost=robots*n("robotCost");
    const mowerLifeYears=Math.max(1,n("mowerLife"));
    const robotLifeYears=Math.max(1,n("robotLife"));
    const currentCapital=n("mowerCost")/mowerLifeYears;
    const hybridRobotCapital=systemCost/robotLifeYears;
    const currentTotal=currentFuel+currentMaint+currentCapital;
    const hybridTotal=hybridFuel+hybridElectric+hybridRobotMaint+backupMowerCost+extraMaint+hybridRobotCapital;
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
    setText("hMaint",gbp(hybridRobotMaint+backupMowerCost+extraMaint));
    setText("hMaintRobotLabel","Robot maintenance ("+robots+" × "+gbp(n("robotMaint"))+")");
    setText("hMaintRobot",gbp(hybridRobotMaint));
    setText("hMaintExtra",gbp(extraMaint));
    setText("hMaintBackup",gbp(backupMowerCost));
    document.getElementById("rowMaintExtra")?.classList.toggle("hidden",extraMaint<=0);
    document.getElementById("rowMaintBackup")?.classList.toggle("hidden",backupMowerCost<=0);
    setText("cCapital",gbp(currentCapital));
    setText("hCapital",gbp(hybridRobotCapital));
    setText("cTotal",gbp(currentTotal));
    setText("hTotal",gbp(hybridTotal));
    setText("saving",gbp(saving));
    setText("capMower",gbp(n("mowerCost")));
    setText("capRobot",gbp(systemCost));
    document.getElementById("kSaving")?.classList.toggle("negative",saving<0);
    document.getElementById("saving")?.classList.toggle("negative",saving<0);

    window.latestReportData={robots,systemCost,saving,extraHours,extraValue,currentFuel,hybridFuel,hybridElectric,currentMaint,hybridRobotMaint,currentCapital,hybridRobotCapital,currentTotal,hybridTotal,robotArea,energyUseKWh,backupMowerCost,extraMaint,
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
    // immediately, then center the field once it's safe to measure.
    document.addEventListener("focusin",e=>{
      if(!e.target.matches("input,textarea")) return;
      const alreadyCollapsed=header.classList.contains("is-collapsed");
      collapseHero();
      const centerField=()=>e.target.scrollIntoView({block:"center"});
      if(alreadyCollapsed){
        requestAnimationFrame(centerField);
      }else{
        // The hero-collapse transition changes the header's height, which
        // shifts every field below it. Centering immediately measures
        // against a header that's still mid-collapse, so the field lands
        // back underneath it once the animation actually finishes — wait
        // for that first (transitionend, with a timeout fallback in case
        // it doesn't fire, e.g. under prefers-reduced-motion).
        header.addEventListener("transitionend",centerField,{once:true});
        setTimeout(centerField,320);
      }
      // Re-check once the on-screen keyboard has actually finished
      // resizing the viewport. That's a separate animation from the
      // header's, and — critically — the *first* time the keyboard opens
      // in a session it can take noticeably longer to settle (IME
      // start-up cost) than on later opens, which is why a fixed delay
      // here previously fixed every field except the first one. Driving
      // this off the real resize/orientationchange signal (debounced,
      // since the animation fires a burst of them) avoids having to
      // guess a duration at all; a generous timeout remains only as a
      // last-resort fallback for browsers that fire neither event.
      let settleTimer=setTimeout(centerField,700);
      const onViewportSettle=()=>{
        clearTimeout(settleTimer);
        settleTimer=setTimeout(centerField,120);
      };
      window.addEventListener("resize",onViewportSettle);
      window.visualViewport?.addEventListener("resize",onViewportSettle);
      const stopWatching=()=>{
        clearTimeout(settleTimer);
        window.removeEventListener("resize",onViewportSettle);
        window.visualViewport?.removeEventListener("resize",onViewportSettle);
      };
      e.target.addEventListener("blur",stopWatching,{once:true});
    });

    // iOS Safari doesn't anchor position:sticky elements to the *visual*
    // viewport when the on-screen keyboard is open — the header can end up
    // rendered above the visible screen — so it needs manual re-anchoring.
    // Chromium-based browsers (Chrome, Samsung Internet, DuckDuckGo, etc.)
    // already handle this correctly at the compositor level; applying our
    // own transform on top there just knocks the header out of sync with
    // the real caret position, which is what caused it to visibly drift.
    // All browsers on iOS are WebKit under the hood (Apple requires it),
    // so this is a platform check, not a "which app" check.
    const isIOS=/iP(hone|od|ad)/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
    if(isIOS&&window.visualViewport){
      const vv=window.visualViewport;
      let keyboardLikelyOpen=false;
      function syncViewportOffset(){
        if(!keyboardLikelyOpen){header.style.transform="";return;}
        header.style.transform=vv.offsetTop?`translateY(${vv.offsetTop}px)`:"";
      }
      document.addEventListener("focusin",e=>{
        if(!e.target.matches("input,textarea")) return;
        keyboardLikelyOpen=true;
      });
      document.addEventListener("focusout",e=>{
        if(!e.target.matches("input,textarea")) return;
        keyboardLikelyOpen=false;
        header.style.transform="";
      });
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
