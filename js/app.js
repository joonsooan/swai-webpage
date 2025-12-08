var queryString = location.search;
const urlParams = new URLSearchParams(queryString);
const utm = urlParams.get("utm");

var mobile = "desktop";
if (
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  )
) {
  mobile = "mobile";
}

function getCookieValue(name) {
  const value = "; " + document.cookie;
  const parts = value.split("; " + name + "=");
  if (parts.length === 2) {
    return parts.pop().split(";").shift();
  }
}

function setCookieValue(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}

function getUVfromCookie() {
  const hash = Math.random().toString(36).substring(2, 8).toUpperCase();
  const existingHash = getCookieValue("user");
  if (!existingHash) {
    setCookieValue("user", hash, 180);
    return hash;
  } else {
    return existingHash;
  }
}

function padValue(value) {
  return value < 10 ? "0" + value : value;
}

function getTimeStamp() {
  const date = new Date();

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();

  const formattedDate = `${padValue(year)}-${padValue(month)}-${padValue(
    day
  )} ${padValue(hours)}:${padValue(minutes)}:${padValue(seconds)}`;

  return formattedDate;
}

addrScript =
  "https://script.google.com/macros/s/AKfycbzJwgFBbPRevLppctrVqrAzy6uuPjKQXMnxf9gr8a1Jy_Prf2ESQNGVOVd3V4pSDRV8UQ/exec";

var data = JSON.stringify({
  id: getUVfromCookie(),
  landingUrl: window.location.href,
  ip: ip,
  referer: document.referrer,
  time_stamp: getTimeStamp(),
  utm: utm,
  device: mobile,
});

$(document).ready(function () {
  $("#submit").on("click", function () {
    const email = $("#submit-email").val();
    const advice = $("#submit-advice").val();

    function validateEmail(email) {
      var re =
        /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
      return re.test(email);
    }

    if (email == "" || !validateEmail(email)) {
      alert("이메일이 유효하지 않습니다. ");
      return;
    }

    $.busyLoadFull("show");

    var finalData = JSON.stringify({
      id: getUVfromCookie(),
      email: email,
      advice: advice,
    });

    axios
      .get(addrScript + "?action=insert&table=tab_final&data=" + finalData)
      .then((response) => {
        console.log("DB 저장 완료:", response.data.data);
        $("#submit-email").val("");
        $("#submit-advice").val("");
        $.busyLoadFull("hide");
        $.fn.simplePopup({ type: "html", htmlSelector: "#popup" });
        if (advice.length > 5) {
          analyzeFeedback(advice);
        }
      })
      .catch((error) => {
        console.error("DB Error:", error);
        $.busyLoadFull("hide");
        alert("오류가 발생했습니다.");
      });
  });
});

axios
  .get(addrScript + "?action=insert&table=visitors&data=" + data)
  .then((response) => {
    console.log(JSON.stringify(response));
  })
  .catch((error) => {
    if (error.response) {
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    } else if (error.request) {
      console.log(error.request);
    } else {
      console.log("Error", error.message);
    }
    console.log(error.config);
  });

const API_BASE_URL = "https://perioecic-edmond-unimitative.ngrok-free.dev";

const toggleBtn = document.getElementById("chatbot-toggle");
const chatWindow = document.getElementById("chat-window");
const closeBtn = document.getElementById("chat-close");
const sendBtn = document.getElementById("chat-send");
const chatInput = document.getElementById("chat-input");
const messagesContainer = document.getElementById("chat-messages");

toggleBtn.addEventListener("click", () => (chatWindow.style.display = "flex"));
closeBtn.addEventListener("click", () => (chatWindow.style.display = "none"));

function addMessage(text, isUser) {
  const div = document.createElement("div");
  div.className = isUser
    ? "d-flex flex-row justify-content-end mb-2"
    : "d-flex flex-row justify-content-start mb-2";
  const innerDiv = document.createElement("div");
  innerDiv.className = isUser ? "p-2 me-2 bg-primary text-white" : "p-2 ms-2";
  innerDiv.style.borderRadius = "15px";
  innerDiv.style.backgroundColor = isUser ? "" : "rgba(13, 110, 253, 0.1)";
  innerDiv.style.maxWidth = "80%";
  innerDiv.innerText = text;
  div.appendChild(innerDiv);
  messagesContainer.appendChild(div);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  addMessage(text, true);
  chatInput.value = "";
  addMessage("입력 중...", false);

  try {
    const response = await axios.post(`${API_BASE_URL}/chat`, {
      message: text,
    });
    messagesContainer.removeChild(messagesContainer.lastChild);
    addMessage(response.data.reply, false);
  } catch (error) {
    messagesContainer.removeChild(messagesContainer.lastChild);
    addMessage("서버 연결 실패 ㅠㅠ", false);
    console.error(error);
  }
}

sendBtn.addEventListener("click", sendMessage);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

async function analyzeFeedback(text) {
  const dashboard = document.getElementById("analytics-dashboard");
  dashboard.style.display = "block";

  dashboard.scrollIntoView({ behavior: "smooth" });

  document.getElementById("dashboard-summary").innerText =
    "AI가 내용을 분석하고 있습니다... 잠시만 기다려주세요.";
  document.getElementById("dashboard-score").innerText = "분석 중...";
  document.getElementById("dashboard-bar").style.width = "0%";

  try {
    const response = await axios.post(`${API_BASE_URL}/analyze`, {
      feedback: text,
    });

    const data = response.data;
    console.log("분석 결과:", data);

    const score = data.sentiment_score;
    const bar = document.getElementById("dashboard-bar");
    const scoreText = document.getElementById("dashboard-score");
    const sentimentText = document.getElementById("dashboard-sentiment");

    scoreText.innerText = score + "점";
    bar.style.width = score + "%";

    if (score >= 70) {
      bar.className = "progress-bar bg-success progress-bar-striped";
      sentimentText.innerText = "😊 매우 긍정적인 반응입니다!";
    } else if (score <= 30) {
      bar.className = "progress-bar bg-danger progress-bar-striped";
      sentimentText.innerText = "😟 부정적인 피드백입니다.";
    } else {
      bar.className = "progress-bar bg-warning progress-bar-striped";
      sentimentText.innerText = "😐 중립적인 의견입니다.";
    }

    document.getElementById("dashboard-summary").innerText = data.summary;
    document.getElementById("dashboard-category").innerText = data.category;
  } catch (e) {
    console.error(e);
    document.getElementById("dashboard-summary").innerText =
      "분석에 실패했습니다. (서버 연결 확인 필요)";
  }
}

async function loadCommunityStats() {
  const summaryEl = document.getElementById("comm-summary");
  const keywordsEl = document.getElementById("comm-keywords");

  summaryEl.innerText = "데이터를 분석하고 있습니다...";
  keywordsEl.innerHTML =
    '<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>';

  try {
    const sheetResponse = await axios.get(
      addrScript + "?action=read&table=tab_final"
    );

    let rows;
    if (
      typeof sheetResponse.data === "string" &&
      sheetResponse.data.startsWith("undefined(")
    ) {
      const jsonString = sheetResponse.data.replace(/^undefined\(|\)$/g, "");
      const parsed = JSON.parse(jsonString);
      rows = parsed.data;
    } else {
      rows = sheetResponse.data.data;
    }

    if (!rows || rows.length === 0) {
      summaryEl.innerText = "아직 등록된 피드백이 없습니다.";
      keywordsEl.innerHTML = "";
      return;
    }

    const feedbacks = rows
      .map((row) => {
        return row.advice || row.Advice || row.ADVICE || row["advice "] || "";
      })
      .filter((text) => text && text.length > 2);

    if (feedbacks.length === 0) {
      summaryEl.innerText = "분석할 유효한 텍스트가 없습니다.";
      keywordsEl.innerHTML = "";
      return;
    }

    const aiResponse = await axios.post(`${API_BASE_URL}/summarize`, {
      feedbacks: feedbacks,
    });

    const result = aiResponse.data;
    summaryEl.innerText = result.overall_summary;

    keywordsEl.innerHTML = "";
    result.top_keywords.forEach((keyword) => {
      const badge = document.createElement("span");
      badge.className = "keyword-chip";
      badge.innerText = keyword;
      keywordsEl.appendChild(badge);
    });
  } catch (e) {
    console.error(e);
    summaryEl.innerText = "통계 분석 중 오류가 발생했습니다.";
    keywordsEl.innerHTML = '<span class="badge bg-danger">Error</span>';
  }
}

$(document).ready(function () {
  loadCommunityStats();
});
