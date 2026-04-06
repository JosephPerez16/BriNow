const DOM={menuBtn:document.getElementById("menuBtn"),mobileDrawer:document.getElementById("mobileDrawer"),locateBtn:document.getElementById("locateBtn"),drawerLocateBtn:document.getElementById("drawerLocateBtn"),statusLabel:document.getElementById("statusLabel"),locationLabel:document.getElementById("locationLabel"),currentTime:document.getElementById("currentTime"),lastUpdatedLabel:document.getElementById("lastUpdatedLabel"),heroDayLabel:document.getElementById("heroDayLabel"),heroTemp:document.getElementById("heroTemp"),heroWeatherText:document.getElementById("heroWeatherText"),heroRate:document.getElementById("heroRate"),heroNewsCount:document.getElementById("heroNewsCount"),heroNewsText:document.getElementById("heroNewsText"),heroWalletBalance:document.getElementById("heroWalletBalance"),heroWalletText:document.getElementById("heroWalletText"),weatherTemp:document.getElementById("weatherTemp"),weatherCondition:document.getElementById("weatherCondition"),feelsLike:document.getElementById("feelsLike"),windSpeed:document.getElementById("windSpeed"),weatherCodeLabel:document.getElementById("weatherCodeLabel"),forecastStrip:document.getElementById("forecastStrip"),usdToDop:document.getElementById("usdToDop"),eurToDop:document.getElementById("eurToDop"),exchangeUpdated:document.getElementById("exchangeUpdated"),originInput:document.getElementById("originInput"),routeForm:document.getElementById("routeForm"),destinationInput:document.getElementById("destinationInput"),routeSummary:document.getElementById("routeSummary"),mapStatus:document.getElementById("mapStatus"),newsQuery:document.getElementById("newsQuery"),searchNewsBtn:document.getElementById("searchNewsBtn"),newsList:document.getElementById("newsList"),incomeForm:document.getElementById("incomeForm"),salaryInput:document.getElementById("salaryInput"),incomeValue:document.getElementById("incomeValue"),expenseValue:document.getElementById("expenseValue"),balanceValue:document.getElementById("balanceValue"),walletStatusValue:document.getElementById("walletStatusValue"),budgetPercentLabel:document.getElementById("budgetPercentLabel"),budgetProgress:document.getElementById("budgetProgress"),expenseForm:document.getElementById("expenseForm"),expenseTitle:document.getElementById("expenseTitle"),expenseAmount:document.getElementById("expenseAmount"),expenseCategory:document.getElementById("expenseCategory"),expensesList:document.getElementById("expensesList"),clearExpensesBtn:document.getElementById("clearExpensesBtn"),startNavBtn:document.getElementById("startNavBtn"),stopNavBtn:document.getElementById("stopNavBtn"),navInstruction:document.getElementById("navInstruction"),navRemaining:document.getElementById("navRemaining"),navMode:document.getElementById("navMode")};
const STORAGE_KEYS={coords:"brinow_coords",locationName:"brinow_location_name",salary:"brinow_salary",expenses:"brinow_expenses"};
const FALLBACK_LOCATION={lat:18.4861,lon:-69.9312,name:"Santo Domingo, RD"};
const state={coords:loadCoords(),locationName:localStorage.getItem(STORAGE_KEYS.locationName)||FALLBACK_LOCATION.name,map:null,userMarker:null,routeLine:null,destinationMarker:null,salary:Number(localStorage.getItem(STORAGE_KEYS.salary)||0),expenses:loadExpenses(),currentRoute:null,navigationActive:false,watchId:null,lastPosition:null};
document.addEventListener("DOMContentLoaded",init);

function init(){bindEvents();initClock();initMap();updateLocationLabel(state.locationName);renderWallet();refreshAll()}

function bindEvents(){
if(DOM.menuBtn){DOM.menuBtn.addEventListener("click",()=>DOM.mobileDrawer.classList.toggle("open"))}
if(DOM.locateBtn){DOM.locateBtn.addEventListener("click",detectUserLocation)}
if(DOM.drawerLocateBtn){DOM.drawerLocateBtn.addEventListener("click",detectUserLocation)}
if(DOM.searchNewsBtn){DOM.searchNewsBtn.addEventListener("click",()=>loadNews(DOM.newsQuery.value.trim()||"República Dominicana"))}
if(DOM.routeForm){DOM.routeForm.addEventListener("submit",async e=>{e.preventDefault();await calculateRoute()})}
if(DOM.startNavBtn){DOM.startNavBtn.addEventListener("click",startNavigation)}
if(DOM.stopNavBtn){DOM.stopNavBtn.addEventListener("click",()=>stopNavigation())}
if(DOM.incomeForm){DOM.incomeForm.addEventListener("submit",e=>{e.preventDefault();const salary=Number(DOM.salaryInput.value);if(!Number.isFinite(salary)||salary<0)return;state.salary=salary;localStorage.setItem(STORAGE_KEYS.salary,String(salary));renderWallet();setStatus("Sueldo guardado")})}
if(DOM.expenseForm){DOM.expenseForm.addEventListener("submit",e=>{e.preventDefault();const title=DOM.expenseTitle.value.trim();const amount=Number(DOM.expenseAmount.value);const category=DOM.expenseCategory.value;if(!title||!Number.isFinite(amount)||amount<=0)return;state.expenses.unshift({id:cryptoRandomId(),title,amount,category,createdAt:new Date().toISOString()});persistExpenses();DOM.expenseTitle.value="";DOM.expenseAmount.value="";DOM.expenseCategory.value="Hogar";renderWallet();setStatus("Gasto agregado")})}
if(DOM.clearExpensesBtn){DOM.clearExpensesBtn.addEventListener("click",()=>{state.expenses=[];persistExpenses();renderWallet();setStatus("Gastos eliminados")})}
if(DOM.expensesList){DOM.expensesList.addEventListener("click",e=>{const button=e.target.closest("[data-expense-id]");if(!button)return;const id=button.getAttribute("data-expense-id");state.expenses=state.expenses.filter(expense=>expense.id!==id);persistExpenses();renderWallet();setStatus("Gasto eliminado")})}
}

function initClock(){const formatter=new Intl.DateTimeFormat("es-DO",{hour:"2-digit",minute:"2-digit"});const weekdayFormatter=new Intl.DateTimeFormat("es-DO",{weekday:"long"});function tick(){const now=new Date();if(DOM.currentTime)DOM.currentTime.textContent=formatter.format(now);if(DOM.heroDayLabel)DOM.heroDayLabel.textContent=capitalize(weekdayFormatter.format(now))}tick();setInterval(tick,1000)}

async function refreshAll(){setStatus("Actualizando");if(DOM.originInput)DOM.originInput.value=state.locationName||"Mi ubicación actual";await Promise.allSettled([loadWeather(),loadExchangeRates(),loadNews("República Dominicana")]);updateMapPosition(state.coords.lat,state.coords.lon,state.locationName);stampUpdated();setStatus("Listo")}

function loadCoords(){const raw=localStorage.getItem(STORAGE_KEYS.coords);if(!raw)return{lat:FALLBACK_LOCATION.lat,lon:FALLBACK_LOCATION.lon};try{const parsed=JSON.parse(raw);if(typeof parsed.lat==="number"&&typeof parsed.lon==="number")return parsed}catch{}return{lat:FALLBACK_LOCATION.lat,lon:FALLBACK_LOCATION.lon}}
function saveCoords(lat,lon){state.coords={lat,lon};localStorage.setItem(STORAGE_KEYS.coords,JSON.stringify(state.coords))}
function loadExpenses(){const raw=localStorage.getItem(STORAGE_KEYS.expenses);if(!raw)return[];try{const parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed:[]}catch{return[]}}
function persistExpenses(){localStorage.setItem(STORAGE_KEYS.expenses,JSON.stringify(state.expenses))}
function updateLocationLabel(name){state.locationName=name;localStorage.setItem(STORAGE_KEYS.locationName,name);if(DOM.locationLabel)DOM.locationLabel.textContent=name;if(DOM.originInput)DOM.originInput.value=name}
function stampUpdated(){if(DOM.lastUpdatedLabel)DOM.lastUpdatedLabel.textContent=new Intl.DateTimeFormat("es-DO",{hour:"2-digit",minute:"2-digit"}).format(new Date())}
function setStatus(text){if(DOM.statusLabel)DOM.statusLabel.textContent=text}

async function detectUserLocation(){
  if(!navigator.geolocation){setStatus("Ubicación no disponible");if(DOM.routeSummary)DOM.routeSummary.textContent="Tu navegador no permite obtener la ubicación.";return}
  setStatus("Detectando ubicación");
  if(DOM.routeSummary)DOM.routeSummary.textContent="Obteniendo ubicación actual...";
  navigator.geolocation.getCurrentPosition(async position=>{
    const {latitude,longitude}=position.coords;
    saveCoords(latitude,longitude);
    state.lastPosition={lat:latitude,lon:longitude};
    await reverseGeocode(latitude,longitude);
    updateMapPosition(latitude,longitude,state.locationName);
    if(DOM.routeSummary)DOM.routeSummary.textContent="Ubicación actual detectada. Ahora escribe el destino.";
    await refreshAll();
  },()=>{
    setStatus("Permiso denegado");
    if(DOM.routeSummary)DOM.routeSummary.textContent="Debes permitir la ubicación para usar la ruta automática.";
  },{enableHighAccuracy:true,timeout:15000,maximumAge:0})
}

async function reverseGeocode(lat,lon){
  try{
    const response=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`);
    const data=await response.json();
    const a=data.address||{};
    const city=a.city||a.town||a.village||a.municipality||"Ubicación actual";
    const country=a.country||"República Dominicana";
    updateLocationLabel(`${city}, ${country}`);
  }catch{
    updateLocationLabel("Mi ubicación actual");
  }
}

function weatherLabelFromCode(code){const map={0:"Despejado",1:"Mayormente despejado",2:"Parcialmente nublado",3:"Nublado",45:"Niebla",48:"Niebla helada",51:"Llovizna ligera",53:"Llovizna",55:"Llovizna intensa",61:"Lluvia ligera",63:"Lluvia",65:"Lluvia fuerte",71:"Nieve ligera",73:"Nieve",75:"Nieve fuerte",80:"Chubascos ligeros",81:"Chubascos",82:"Chubascos fuertes",95:"Tormenta"};return map[code]||"Tiempo actual"}

async function loadWeather(){try{const {lat,lon}=state.coords;const response=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,wind_speed_10m,weather_code&hourly=temperature_2m,weather_code&forecast_days=2&timezone=auto`);if(!response.ok)throw new Error("weather");const data=await response.json();const c=data.current;const weatherText=weatherLabelFromCode(c.weather_code);if(DOM.weatherTemp)DOM.weatherTemp.textContent=`${Math.round(c.temperature_2m)}°C`;if(DOM.weatherCondition)DOM.weatherCondition.textContent=weatherText;if(DOM.feelsLike)DOM.feelsLike.textContent=`${Math.round(c.apparent_temperature)}°C`;if(DOM.windSpeed)DOM.windSpeed.textContent=`${Math.round(c.wind_speed_10m)} km/h`;if(DOM.weatherCodeLabel)DOM.weatherCodeLabel.textContent=String(c.weather_code);if(DOM.heroTemp)DOM.heroTemp.textContent=`${Math.round(c.temperature_2m)}°`;if(DOM.heroWeatherText)DOM.heroWeatherText.textContent=weatherText;const hours=(data.hourly.time||[]).slice(0,6).map((time,index)=>({time,temperature:data.hourly.temperature_2m[index],weatherCode:data.hourly.weather_code[index]}));if(DOM.forecastStrip)DOM.forecastStrip.innerHTML=hours.map(item=>`<div class="forecast-item"><span class="hour">${new Date(item.time).toLocaleTimeString("es-DO",{hour:"2-digit",minute:"2-digit"})}</span><span class="temp">${Math.round(item.temperature)}°</span><span class="desc">${weatherLabelFromCode(item.weatherCode)}</span></div>`).join("")}catch{if(DOM.weatherTemp)DOM.weatherTemp.textContent="--°C";if(DOM.weatherCondition)DOM.weatherCondition.textContent="No se pudo cargar el clima";if(DOM.feelsLike)DOM.feelsLike.textContent="--°C";if(DOM.windSpeed)DOM.windSpeed.textContent="-- km/h";if(DOM.weatherCodeLabel)DOM.weatherCodeLabel.textContent="--";if(DOM.heroTemp)DOM.heroTemp.textContent="--°";if(DOM.heroWeatherText)DOM.heroWeatherText.textContent="Sin clima";if(DOM.forecastStrip)DOM.forecastStrip.innerHTML=`<div class="empty-state">No se pudo cargar el pronóstico.</div>`}}

async function loadExchangeRates(){try{const [usdResponse,eurResponse]=await Promise.all([fetch("https://open.er-api.com/v6/latest/USD"),fetch("https://open.er-api.com/v6/latest/EUR")]);if(!usdResponse.ok||!eurResponse.ok)throw new Error("fx");const usdData=await usdResponse.json();const eurData=await eurResponse.json();const usdToDop=usdData?.rates?.DOP;const eurToDop=eurData?.rates?.DOP;if(DOM.usdToDop)DOM.usdToDop.textContent=usdToDop?formatMoney(usdToDop):"--";if(DOM.eurToDop)DOM.eurToDop.textContent=eurToDop?formatMoney(eurToDop):"--";if(DOM.exchangeUpdated)DOM.exchangeUpdated.textContent=new Intl.DateTimeFormat("es-DO",{hour:"2-digit",minute:"2-digit"}).format(new Date());if(DOM.heroRate)DOM.heroRate.textContent=usdToDop?formatMoney(usdToDop):"--"}catch{if(DOM.usdToDop)DOM.usdToDop.textContent="--";if(DOM.eurToDop)DOM.eurToDop.textContent="--";if(DOM.exchangeUpdated)DOM.exchangeUpdated.textContent="Sin conexión";if(DOM.heroRate)DOM.heroRate.textContent="--"}}

async function loadNews(query){try{if(DOM.newsList)DOM.newsList.innerHTML=`<div class="empty-state">Cargando noticias...</div>`;const feedUrl=`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=es-419&gl=DO&ceid=DO:es-419`;const proxyUrl=`https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;const response=await fetch(proxyUrl);if(!response.ok)throw new Error("news");const xmlText=await response.text();const parser=new DOMParser();const xml=parser.parseFromString(xmlText,"text/xml");const items=Array.from(xml.querySelectorAll("item")).slice(0,6);if(!items.length){if(DOM.newsList)DOM.newsList.innerHTML=`<div class="empty-state">No se encontraron noticias para esa búsqueda.</div>`;if(DOM.heroNewsCount)DOM.heroNewsCount.textContent="0";if(DOM.heroNewsText)DOM.heroNewsText.textContent="Sin resultados";return}const articles=items.map(item=>({title:item.querySelector("title")?.textContent||"Sin título",link:item.querySelector("link")?.textContent||"#",pubDate:item.querySelector("pubDate")?.textContent||"",source:item.querySelector("source")?.textContent||"Fuente",image:`https://picsum.photos/seed/${encodeURIComponent(item.querySelector("title")?.textContent||Math.random())}/400/300`}));if(DOM.newsList)DOM.newsList.innerHTML=articles.map(article=>`<article class="news-item"><img src="${article.image}" alt="Noticia"><div class="news-content"><h4>${escapeHtml(article.title)}</h4><p>${escapeHtml(article.source)} · ${escapeHtml(formatNewsDate(article.pubDate))}</p><a href="${article.link}" target="_blank" rel="noopener noreferrer">Ver noticia</a></div></article>`).join("");if(DOM.heroNewsCount)DOM.heroNewsCount.textContent=String(articles.length);if(DOM.heroNewsText)DOM.heroNewsText.textContent=query}catch{if(DOM.newsList)DOM.newsList.innerHTML=`<div class="empty-state">No se pudieron cargar las noticias ahora mismo.</div>`;if(DOM.heroNewsCount)DOM.heroNewsCount.textContent="0";if(DOM.heroNewsText)DOM.heroNewsText.textContent="Error"}}

function initMap(){
  if(typeof L==="undefined"||!document.getElementById("map")) return;
  const {lat,lon}=state.coords;
  state.map=L.map("map",{zoomControl:true}).setView([lat,lon],12);
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",{attribution:"&copy; OpenStreetMap &copy; CARTO"}).addTo(state.map);
  state.userMarker=L.marker([lat,lon]).addTo(state.map);
  state.userMarker.bindPopup(`<strong>${escapeHtml(state.locationName)}</strong>`);
}

function updateMapPosition(lat,lon,label){
  if(!state.map)return;
  state.map.setView([lat,lon],state.navigationActive?17:12);
  if(state.userMarker){
    state.userMarker.setLatLng([lat,lon]);
    state.userMarker.bindPopup(`<strong>${escapeHtml(label)}</strong>`);
  }
  if(DOM.mapStatus)DOM.mapStatus.textContent=`Vista centrada en ${label}.`;
}

async function geocodeLocation(query){
  if(!query||query.trim().length<3) throw new Error("Destino inválido");
  const tries=[
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=es&countrycodes=do&q=${encodeURIComponent(query)}`,
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=es&q=${encodeURIComponent(query)}`
  ];
  for(const url of tries){
    const response=await fetch(url);
    if(!response.ok)continue;
    const data=await response.json();
    if(Array.isArray(data)&&data.length){
      return{lat:Number(data[0].lat),lon:Number(data[0].lon),name:data[0].display_name};
    }
  }
  throw new Error("Destino no encontrado");
}

async function snapToRoad(lat,lon){
  const response=await fetch(`https://router.project-osrm.org/nearest/v1/driving/${lon},${lat}`);
  if(!response.ok)throw new Error("No se pudo ajustar a la vía");
  const data=await response.json();
  const waypoint=data.waypoints?.[0];
  if(!waypoint||!waypoint.location)throw new Error("Sin vía cercana");
  return{lon:waypoint.location[0],lat:waypoint.location[1]};
}

async function calculateRoute(){
  const destinationText=DOM.destinationInput?.value.trim()||"";
  if(!destinationText){if(DOM.routeSummary)DOM.routeSummary.textContent="Escribe un destino";return}
  if(!state.coords||typeof state.coords.lat!=="number"||typeof state.coords.lon!=="number"){if(DOM.routeSummary)DOM.routeSummary.textContent="Activa tu ubicación primero";return}
  try{
    if(DOM.routeSummary)DOM.routeSummary.textContent="Calculando ruta...";
    if(DOM.navInstruction)DOM.navInstruction.textContent="Preparando navegación";
    if(DOM.navRemaining)DOM.navRemaining.textContent="--";

    const destination=await geocodeLocation(destinationText);
    const originSnap=await snapToRoad(state.coords.lat,state.coords.lon);

    let destSnap;
    try{
      destSnap=await snapToRoad(destination.lat,destination.lon);
    }catch{
      destSnap={lat:destination.lat,lon:destination.lon};
    }

    const url=`https://router.project-osrm.org/route/v1/driving/${originSnap.lon},${originSnap.lat};${destSnap.lon},${destSnap.lat}?overview=full&geometries=geojson&steps=true`;
    const response=await fetch(url);
    if(!response.ok)throw new Error("Error en servidor de rutas");

    const data=await response.json();
    if(!data.routes||data.routes.length===0)throw new Error("No hay ruta disponible");

    const route=data.routes[0];
    state.currentRoute={
      distance:route.distance,
      duration:route.duration,
      geometry:route.geometry.coordinates,
      steps:(route.legs?.[0]?.steps||[]).map(step=>({
        instruction:buildInstruction(step),
        distance:step.distance,
        duration:step.duration,
        maneuverLocation:step.maneuver?.location||null
      })),
      destination,
      snappedDestination:destSnap
    };

    drawRoute(route.geometry.coordinates,destination);
    if(DOM.routeSummary)DOM.routeSummary.textContent=`${(route.distance/1000).toFixed(1)} km · ${Math.round(route.duration/60)} min`;
    if(DOM.mapStatus)DOM.mapStatus.textContent="Ruta calculada correctamente";
    if(DOM.navInstruction)DOM.navInstruction.textContent=state.currentRoute.steps[0]?.instruction||"Ruta lista";
    if(DOM.navRemaining)DOM.navRemaining.textContent=`${(route.distance/1000).toFixed(1)} km`;
    if(DOM.navMode)DOM.navMode.textContent="Ruta lista";
  }catch(error){
    console.error(error);
    if(DOM.routeSummary)DOM.routeSummary.textContent=error.message||"No se pudo calcular la ruta";
    if(DOM.mapStatus)DOM.mapStatus.textContent="Error de ruta";
    if(DOM.navInstruction)DOM.navInstruction.textContent="Error de ruta";
    if(DOM.navMode)DOM.navMode.textContent="Error";
  }
}

function drawRoute(coordinates,destination){
  if(!state.map)return;
  const latLngs=coordinates.map(([lon,lat])=>[lat,lon]);
  if(state.routeLine)state.map.removeLayer(state.routeLine);
  if(state.destinationMarker)state.map.removeLayer(state.destinationMarker);
  state.routeLine=L.polyline(latLngs,{weight:6,opacity:.95,color:"#6ea8ff"}).addTo(state.map);
  state.destinationMarker=L.marker([destination.lat,destination.lon]).addTo(state.map);
  state.destinationMarker.bindPopup(`<strong>${escapeHtml(destination.name)}</strong>`);
  state.map.fitBounds(state.routeLine.getBounds(),{padding:[35,35]});
}

function startNavigation(){
  if(!state.currentRoute){if(DOM.navMode)DOM.navMode.textContent="Sin ruta";if(DOM.navInstruction)DOM.navInstruction.textContent="Calcula una ruta primero";return}
  if(!navigator.geolocation){if(DOM.navMode)DOM.navMode.textContent="No disponible";return}
  stopNavigation(false);
  state.navigationActive=true;
  if(DOM.navMode)DOM.navMode.textContent="Navegando";
  if(DOM.routeSummary)DOM.routeSummary.textContent="Navegación activa. Puedes seguir la ruta en el mapa.";
  state.watchId=navigator.geolocation.watchPosition(async position=>{
    const lat=position.coords.latitude;
    const lon=position.coords.longitude;
    state.lastPosition={lat,lon};
    saveCoords(lat,lon);
    updateMapPosition(lat,lon,"Mi ubicación actual");
    await updateNavigationProgress(lat,lon);
  },()=>{
    if(DOM.navMode)DOM.navMode.textContent="Error GPS";
    if(DOM.navInstruction)DOM.navInstruction.textContent="No se pudo seguir tu ubicación";
  },{enableHighAccuracy:true,maximumAge:1000,timeout:10000});
}

function stopNavigation(updateUi=true){
  if(state.watchId!==null){
    navigator.geolocation.clearWatch(state.watchId);
    state.watchId=null;
  }
  state.navigationActive=false;
  if(updateUi){
    if(DOM.navMode)DOM.navMode.textContent="Inactivo";
    if(DOM.navInstruction)DOM.navInstruction.textContent="Navegación detenida";
  }
}

async function updateNavigationProgress(lat,lon){
  if(!state.currentRoute)return;
  try{
    const snapped=await snapToRoad(lat,lon);
    const remainingDistance=distanceBetween(snapped.lat,snapped.lon,state.currentRoute.snappedDestination.lat,state.currentRoute.snappedDestination.lon);
    if(DOM.navRemaining)DOM.navRemaining.textContent=remainingDistance>=1000?`${(remainingDistance/1000).toFixed(1)} km`:`${Math.round(remainingDistance)} m`;
    const nextStep=findNextStep(snapped.lat,snapped.lon,state.currentRoute.steps);
    if(DOM.navInstruction)DOM.navInstruction.textContent=nextStep?.instruction||"Sigue la ruta marcada";
    if(remainingDistance<35){
      if(DOM.navInstruction)DOM.navInstruction.textContent="Has llegado al destino";
      if(DOM.navMode)DOM.navMode.textContent="Llegaste";
      if(DOM.routeSummary)DOM.routeSummary.textContent="Ruta completada.";
      stopNavigation(false);
    }
  }catch{
    if(DOM.navInstruction)DOM.navInstruction.textContent="Sigue la ruta marcada";
  }
}

function findNextStep(lat,lon,steps){
  let best=null;
  let bestDistance=Infinity;
  for(const step of steps){
    if(!step.maneuverLocation)continue;
    const [slon,slat]=step.maneuverLocation;
    const d=distanceBetween(lat,lon,slat,slon);
    if(d<bestDistance){
      bestDistance=d;
      best=step;
    }
  }
  return best;
}

function buildInstruction(step){
  const maneuver=step.maneuver||{};
  const type=maneuver.type||"continue";
  const modifier=maneuver.modifier||"";
  const road=step.name?` por ${step.name}`:"";
  const map={
    continue:"Sigue recto",
    depart:"Sal",
    turn:"Gira",
    merge:"Incorpórate",
    on_ramp:"Toma la entrada",
    off_ramp:"Toma la salida",
    fork:"Mantente",
    roundabout:"Entra en la rotonda",
    arrive:"Llegaste al destino"
  };
  let text=map[type]||"Continúa";
  if(modifier){
    const modMap={left:"a la izquierda",right:"a la derecha",straight:"recto","slight left":"ligeramente a la izquierda","slight right":"ligeramente a la derecha","sharp left":"fuerte a la izquierda","sharp right":"fuerte a la derecha",uturn:"en U"};
    text+=` ${modMap[modifier]||modifier}`;
  }
  return `${text}${road}`.trim();
}

function distanceBetween(lat1,lon1,lat2,lon2){
  const R=6371000;
  const toRad=v=>v*Math.PI/180;
  const dLat=toRad(lat2-lat1);
  const dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2+Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(a));
}

function renderWallet(){const totalExpenses=state.expenses.reduce((sum,expense)=>sum+Number(expense.amount),0);const balance=state.salary-totalExpenses;const percent=state.salary>0?Math.min(totalExpenses/state.salary*100,100):0;if(DOM.salaryInput)DOM.salaryInput.value=state.salary?state.salary:"";if(DOM.incomeValue)DOM.incomeValue.textContent=formatCurrencyDOP(state.salary);if(DOM.expenseValue)DOM.expenseValue.textContent=formatCurrencyDOP(totalExpenses);if(DOM.balanceValue)DOM.balanceValue.textContent=formatCurrencyDOP(balance);if(DOM.budgetPercentLabel)DOM.budgetPercentLabel.textContent=`${Math.round(percent)}%`;if(DOM.budgetProgress)DOM.budgetProgress.style.width=`${Math.max(0,Math.min(percent,100))}%`;if(DOM.heroWalletBalance)DOM.heroWalletBalance.textContent=formatCurrencyDOP(balance);if(DOM.heroWalletText)DOM.heroWalletText.textContent=balance<0?"Sobregirado":"Saldo disponible";if(DOM.walletStatusValue){if(state.salary<=0){DOM.walletStatusValue.textContent="Agrega tu sueldo"}else if(balance<0){DOM.walletStatusValue.textContent="Sobregirado"}else if(percent>=90){DOM.walletStatusValue.textContent="Muy ajustado"}else if(percent>=70){DOM.walletStatusValue.textContent="Cuidado"}else{DOM.walletStatusValue.textContent="Saludable"}}if(!DOM.expensesList)return;if(!state.expenses.length){DOM.expensesList.innerHTML=`<div class="empty-state">Aún no has agregado gastos.</div>`;return}DOM.expensesList.innerHTML=state.expenses.map(expense=>`<article class="expense-item"><div class="expense-main"><strong>${escapeHtml(expense.title)}</strong><p>${escapeHtml(expense.category)} · ${formatNewsDate(expense.createdAt)}</p></div><div class="expense-right"><strong>${formatCurrencyDOP(expense.amount)}</strong><button class="delete-expense-btn" data-expense-id="${expense.id}">Eliminar</button></div></article>`).join("")}
function formatMoney(value){return new Intl.NumberFormat("es-DO",{minimumFractionDigits:2,maximumFractionDigits:2}).format(value)}
function formatCurrencyDOP(value){return new Intl.NumberFormat("es-DO",{style:"currency",currency:"DOP"}).format(Number(value||0))}
function formatNewsDate(value){if(!value)return"Fecha no disponible";const date=new Date(value);if(Number.isNaN(date.getTime()))return value;return new Intl.DateTimeFormat("es-DO",{day:"2-digit",month:"short",year:"numeric"}).format(date)}
function capitalize(text){return text?text.charAt(0).toUpperCase()+text.slice(1):""}
function escapeHtml(value){return String(value).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;")}
function cryptoRandomId(){return window.crypto&&crypto.randomUUID?crypto.randomUUID():`id-${Date.now()}-${Math.random().toString(16).slice(2)}`}
