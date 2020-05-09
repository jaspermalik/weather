const today = document.querySelector(".today");
const todayTemNum = today.querySelector(".number");
const todayIcon = today.querySelector(".iconfont.main .today-icon");
const todayDate = today.querySelector(".date");
const locate = today.querySelector(".location");
const elWeek = todayDate.querySelector(".week");
const elTime = todayDate.querySelector(".time");
const rainRate = today.querySelector(".rain-rate .value");
const city = today.querySelector(".city span");
const elInput = document.getElementById("search-input");
const hightlights = document.querySelector(".hightlights");
const weatherCardGroups = document.querySelector(".weather-card-groups");
const uv = hightlights.querySelector(".board .value");
const uvBoard = hightlights.querySelector(".board .fill");
const windSpeed = hightlights.querySelector(".wind-speed .value");
const windDir = hightlights.querySelector(".wind-direction .text");
const sunrise = hightlights.querySelector(".sunrise .time");
const sunset = hightlights.querySelector(".sunset .time");
const humidityValue = hightlights.querySelector(".humidity .value");
const humidityStatus = hightlights.querySelector(".humidity~.status");
const humStick = hightlights.querySelector(".stick.hum .circle");
const visibilityValue = hightlights.querySelector(".visibility .value");
const visibilityStatus = hightlights.querySelector(".visibility~.status");
const airqualityValue = hightlights.querySelector(".air-quality");
const airqualityStatus = hightlights.querySelector(".air-quality~.status");
const airqualityStick = hightlights.querySelector(".stick.air .circle");
const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
const KEY = "9d81cb77ff00403285ed4a3aba2caef1";

init();

function init() {
  inputSubmit();
  handleLocateClick();
  getLocalStorage();
}

function getLocalStorage() {
  const addr = localStorage.getItem("location");
  if (addr) {
    fetchAll(addr);
  } else {
    alert("请手动输入地址，或点击定位");
  }
}

function setLocalStorage(key, value) {
  localStorage.setItem(key, value);
}

function handleLocateClick() {
  locate.addEventListener("click", getCurPos);
}

function getCurPos() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      position => {
        const { longitude, latitude } = position.coords;
        const locateString = `${longitude},${latitude}`;
        fetchAll(locateString);
        setLocalStorage("location", locateString);
      },
      error => {
        if (error.code == 1) {
          alert("Error: Access is denied!");
        } else if (error.code == 2) {
          alert("Error: Position is unavailable!");
        }
      }
    );
  } else {
    alert("地理位置服务不可用");
  }
}

function inputSubmit() {
  elInput.addEventListener("keyup", e => {
    if (e.keyCode === 13) {
      const value = e.target.value;
      if (value) {
        fetchAll(value);
        setLocalStorage("location", value);
      } else {
        alert("请输入城市名称");
      }
    }
  });
}

async function fetchAll(location) {
  const BASEAPI = "https://free-api.heweather.net/s6/";
  const params = `?location=${location}&&key=${KEY}`;
  const URLS = [
    `${BASEAPI}weather/now${params}`,
    `${BASEAPI}weather/forecast${params}`,
    `${BASEAPI}air/now${params}`
  ];
  const responses = await Promise.all(URLS.map(url => fetch(url)));
  const resJson = await Promise.all(responses.map(response => response.json()));
  const [nowRes, forecastRes, air] = resJson.map(item => item.HeWeather6[0]);
  setValue({ nowRes, forecastRes, air });
}

function setValue({ nowRes, forecastRes, air }) {
  if (nowRes.status === "unknown location") {
    alert("请输入正确的城市名称");
    return;
  }
  setToday(nowRes, forecastRes);
  setWeatherGroup(forecastRes);
  setAirStatus(air);
}

function setToday(nowRes, forecastRes) {
  const { basic, update, now } = nowRes;
  const { location } = basic;
  const { tmp, cond_code } = now;
  const { loc } = update;
  const icon = getIcon(parseInt(cond_code));
  todayIcon.setAttribute("xlink:href", `#${icon}`);
  city.textContent = location;
  todayTemNum.textContent = tmp;
  const { week, time } = formateTime(loc);
  elWeek.textContent = week;
  elTime.textContent = time;
  const todayForecast = forecastRes.daily_forecast[0];
  const todayRate = todayForecast.pop;
  rainRate.textContent = todayRate;
  uv.textContent = todayForecast.uv_index;
  uvBoard.style.strokeDasharray = 18.5 * todayForecast.uv_index + 218;
  windSpeed.textContent = todayForecast.wind_spd;
  windDir.textContent = todayForecast.wind_dir;
  sunrise.textContent = todayForecast.sr;
  sunset.textContent = todayForecast.ss;
  humidityValue.textContent = todayForecast.hum;
  humStick.style.bottom = (todayForecast.hum / 100) * 64 + "px";
  humidityStatus.textContent = checkHumStatus(todayForecast.hum);
  visibilityValue.textContent = todayForecast.vis;
}

function setWeatherGroup(forecastRes) {
  weatherCardGroups.innerHTML = "";
  let fragment = document.createDocumentFragment();
  forecastRes.daily_forecast.forEach(item => {
    const { week } = formateTime(item.date);
    const elCard = document.createElement("div");
    const innerIcon = getIcon(parseInt(item.cond_code_d));
    elCard.classList.add("card");
    elCard.innerHTML = `
      <div class="card-title">${week}</div>
        <div class="weather-icon">
           <svg class="iconfont unknown" aria-hidden="true">
                  <use xlink:href="#${innerIcon}"></use>
           </svg>
        </div>
      <div class="card-tmp"><span class="high">${item.tmp_max}</span><span class="low">${item.tmp_min}</span></div>
    `;
    fragment.appendChild(elCard);
  });
  weatherCardGroups.appendChild(fragment);
}

function setAirStatus(air) {
  if (air.status === "ok") {
    const airData = air.air_now_city;
    airqualityValue.textContent = airData.aqi;
    airqualityStatus.textContent = airData.qlty;
    airqualityStick.style.bottom = (airData.aqi / 500) * 64 + "px";
  } else {
    airqualityValue.textContent = "0";
    airqualityStatus.textContent = "暂不支持";
  }
}

function checkHumStatus(value) {
  if (value >= 80) {
    return "高";
  } else if (value >= 30 && value < 80) {
    return "正常";
  } else if (value < 30) {
    return "低";
  }
}

function formateTime(dateString) {
  if (isSafari) {
    dateString = dateString.replace(/-/g, "/");
  }
  const weeks = [
    "星期日",
    "星期一",
    "星期二",
    "星期三",
    "星期四",
    "星期五",
    "星期六"
  ];
  const dayIndex = new Date(dateString).getDay();
  const week = weeks[dayIndex];
  const time = dateString.split(" ")[1];
  return { week, time };
}

function getIcon(code) {
  if (code === 100 || code === 103 || code === 201) return "icon-Sunny";
  if (code === 101) return "icon-Cloudy";
  if (code === 102) return "icon-FewClouds";
  if (code === 104) return "icon-Overcast";
  if (code === 200 || (code >= 202 && code <= 204)) return "icon-Windy";
  if (code >= 205 && code <= 210) return "icon-Gale";
  if (code === 211 || code === 213) return "icon-Hurricane";
  if (code >= 300 && code <= 303) return "icon-Thundershower";
  if (code === 304) return "icon-Thundershowerwithhail";
  if (code === 305 || code === 309 || code === 399) return "icon-LightRain";
  if (code === 306 || code === 314) return "icon-ModerateRain";
  if (code === 307 || code === 313 || code === 315) return "icon-HeavyRain";
  if (
    code === 308 ||
    (code >= 310 && code <= 311) ||
    code === 316 ||
    code === 317
  )
    return "icon-Storm";
  if (code === 312 || code === 318) return "icon-SevereStorm";
  if (code === 400) return "icon-LightSnow";
  if (code === 401 || code === 408 || code === 499) return "icon-ModerateSnow";
  if (code === 402 || code === 409) return "icon-HeavySnow";
  if (code === 403 || code === 410) return "icon-Snowstorm";
  if (code >= 404 && code <= 407) return "icon-Sleet";
  if (
    code === 500 ||
    code === 501 ||
    code === 509 ||
    code === 510 ||
    code === 514 ||
    code === 515
  )
    return "icon-Foggy";
  if (code === 502) return "icon-Haze";
  if (code === 503) return "icon-Sand";
  if (code === 504) return "icon-Dust";
  if (code === 507) return "icon-Duststorm";
  if (code === 508) return "icon-Sandstorm";
  if (code === 511) return "icon-Moderatehaze";
  if (code === 512) return "icon-Heavyhaze";
  if (code === 513) return "icon-Severehaze";
  if (code === 900) return "icon-hot";
  if (code === 901) return "icon-cold";
  return "icon-Unknown";
}
