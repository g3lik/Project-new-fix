"use strict";
// ---------------------- Variables ----------------------
let coins = [];
let selectedCoins = [];
let chart;

$(() => {
 // ---------------------- Section Navigation ----------------------
    $("section").hide();
    $("#homeSection").show();
    $("a").on("click", function () {
        const dataSection = $(this).attr("data-section");
        $("section").hide();
        $("#" + dataSection).show();
    });
  // ---------------------- Search Functionality ----------------------
    $("input[type=text]").on("keyup", function () {
        const textToSearch = $(this).val().toLowerCase();
        if (textToSearch === "") {
            displayCoins(coins);
        } else {
            const filteredCoins = coins.filter(c => c.symbol.indexOf(textToSearch) >= 0);
            if (filteredCoins.length > 0) {
                displayCoins(filteredCoins);
            }
        }
    });
 // ---------------------- Fetch Coins Data ----------------------
    fetchCoins();

    async function fetchCoins() {
        try {
            const response = await getJSON("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd");
            coins = response;
            displayCoins(coins);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    }
  // ---------------------- Display Coins ----------------------
function displayCoins(coins) {
    let content = '<h1 class="selecth1Container">Select Coins</h1>';  
    content += '<div class="cardsContainer">';
    for (let i = 0; i < coins.length; i++) {
    const coin = coins[i];
    const iconUrl = coin.image;
    const isChecked = selectedCoins.some(c => c.id === coin.id);
     content += `
        <div class="card" style="width: 18rem;">
        <img class="card-img-top" src="${iconUrl}" alt="${coin.name}" onerror="this.onerror=null; this.src='https://via.placeholder.com/150?text=No+Icon';">
        <div class="card-body">
        <h5 class="card-title">${coin.name}</h5>
        <p class="card-text"> Symbol: (${coin.symbol})</p> 
        <button class="btn btn-primary more-info-btn" data-coin-id="${coin.id}">More Info</button>
        </div>
        <div class="card-footer">
        <label class="switch">
        <input type="checkbox" class="toggle-switch" data-coin-id="${coin.id}" ${isChecked ? 'checked' : ''}>
         <span class="slider round"></span>
        </label>
        </div>
        <div class="coin-details"></div>
        </div>
            `;
     }
        content += '</div>';
        $("#homeSection").html(content);
    }
 // ---------------------- More Info Button ----------------------
$("#homeSection").on("click", ".more-info-btn", async function () {
    const coinId = $(this).data("coin-id");
    const detailsDiv = $(this).closest('.card').find(".coin-details");
    if (detailsDiv.html() === "") {
     detailsDiv.html('<div class="spinner"><div class="dot1"></div><div class="dot2"></div><div class="dot3"></div></div>');
     try {
    const coin = await getMoreInfo(coinId);
    const coinDetails = `
     <br><br>
     <img src="assets/images/dollar.png" /> USD:  ${coin.market_data.current_price.usd} $  <br>
     <img src="assets/images/euro.png" /> EUR:  ${coin.market_data.current_price.eur} € <br>
     <img src="assets/images/shekel.png" /> ILS:  ${coin.market_data.current_price.ils} ₪
  `;
    detailsDiv.html(coinDetails);
     $(this).text('Less Info');
     } catch (err) {
     console.error("Error fetching more info:", err);
     }
    } else {
      detailsDiv.html("");
       $(this).text('More Info');
        }
    });
// ---------------------- Coin Selection ----------------------
$("#homeSection").on("change", ".toggle-switch", function () {
    const coinId = $(this).data("coin-id");
    const coin = coins.find(c => c.id === coinId);

    if ($(this).prop("checked")) {
     if (selectedCoins.length < 5) {
      selectedCoins.push(coin);
    } else {
        showModalForRemovingCoin(coin);
        $(this).prop("checked", false);
            }
        } else {
         selectedCoins = selectedCoins.filter(c => c.id !== coinId);
        }
    updateSelectedCoinsList();
    displayCoins(coins);
    updateChart();
    if (selectedCoins.length > 0 && !chart) {
     createChart();
     
 }
    });
 // ---------------------- Update Selected Coins ----------------------
function updateSelectedCoinsList() {
let content = '<ul>';
selectedCoins.forEach(coin => {
 content += `
     <li>
  ${coin.name} (${coin.symbol})
    <button class="btn btn-danger remove-btn" data-coin-id="${coin.id}">Remove</button>
     </li>
    `;
 });
    content += '</ul>';
 $("#selectedCoinsList").html(content);
 createChart();
    }

 // ---------------------- Remove Coin Modal ----------------------
function showModalForRemovingCoin(coinToAdd) {
 const modalContent = `
  <div class="modal-content" data-coin-id="${coinToAdd.id}">
  <h5 class = "h5Container">Replace a Coin</h5>
  <p>To add ${coinToAdd.name}, you need to replace one of the following coins:</p>
  <ul>
 ${selectedCoins.map(coin => `
 <li>
     ${coin.name} (${coin.symbol})
  <button class="btn btn-danger remove-from-modal" data-coin-id="${coin.id}">Replace</button>
  </li>
  `).join('')}
    </ul>
    <button id="cancelBtn" class="btn btn-secondary">Cancel</button>
    </div>
 `;
 $("body").append(`<div class="modal">${modalContent}</div>`);

 $("body").on("click", "#cancelBtn", function () {
    $(".modal").remove(); 
});
 }

// ---------------------- Remove Coin from Modal ----------------------
$("body").on("click", ".remove-from-modal", function () {
  const coinId = $(this).data("coin-id");
  const coinToAdd = $(this).closest('.modal-content').data('coin-id');
  selectedCoins = selectedCoins.filter(coin => coin.id !== coinId);
  const coin = coins.find(c => c.id === coinToAdd);
  selectedCoins.push(coin);
  chart.render();
  updateSelectedCoinsList();
  displayCoins(coins);
  updateLiveReport();
  $(".modal").remove();
    });

  // ---------------------- Remove Coin from Selected List ----------------------
$("#selectedCoinsList").on("click", ".remove-btn", function () {
  const coinId = $(this).data("coin-id");
  selectedCoins = selectedCoins.filter(coin => coin.id !== coinId);
  updateSelectedCoinsList();
  chart.render();
  displayCoins(coins);
 });

 // ---------------------- Update Live Report ----------------------
function updateLiveReport() {
 let content = '<ul>';
 selectedCoins.forEach(coin => {
 content += `<li>${coin.name} (${coin.symbol}) <button class="btn btn-danger remove-btn" data-coin-id="${coin.id}">Remove</button></li>`;
 });
 content += '</ul>';
 $("#selectedCoinsList").html(content);
  }

 // ---------------------- Fetch Live Prices ----------------------
    async function fetchLivePrices() {
        const coinsSymbols = selectedCoins.map(coin => coin.symbol).join(',');
        const url = `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${coinsSymbols}&tsyms=USD`;
    
        try {
            const response = await axios.get(url);
            console.log("Live prices fetched:", response.data); 
            return response.data;
        } catch (error) {
            console.error('Error fetching live prices:', error);
            return {};
        }
    }
    let counter = 0;

 // ---------------------- Update Chart ----------------------
async function updateChart() {
    if (!chart) {
    console.error("Chart is not initialized yet");
    return;
}
    const livePrices = await fetchLivePrices();
     const time = new Date().getTime();
    selectedCoins.forEach((coin, index) => {
     const price = livePrices[coin.symbol.toUpperCase()]?.USD;
    if (!price) {
    console.error(`No price found for ${coin.symbol}`);
     return;
}
    if (chart.options.data && chart.options.data[index]) {
    chart.options.data[index].dataPoints.push({
    x: time,
    y: price
});
    if (chart.options.data[index].dataPoints.length > 20) {
    chart.options.data[index].dataPoints.shift(); 
}
    } else {
    console.error(`No data object found for coin: ${coin.symbol}`);
    if (chart.options.data) {
    chart.options.data.push({
    type: "line",
    name: coin.symbol,
    showInLegend: true,
    dataPoints: [{ x: time, y: price }]
});
    }
        }
          });
    chart.render(); 
    console.log("Chart rendered with updated data");
    counter++; 
}

       // ---------------------- Create Chart ----------------------
function createChart() {
 if (chart) {
  chart.options.data = selectedCoins.map(coin => ({
        type: "line",
         name: coin.symbol,
        showInLegend: true,
        dataPoints: [{ x: new Date().getTime(), y: 0 }]  
}));

 chart.render();  
} else {
    chart = new CanvasJS.Chart("liveChart", {
    title: { text: "Live Crypto-currency Prices" },
    axisX: {
        title: "Time (1Min)",
        includeZero: false,  
        intervalType: "minute",  
        labelFormatter: function(e) {
         return new Date(e.value).toLocaleTimeString();
 }
     },
axisY: {
title: "Price (USD)",
includeZero: false,  
prefix: "$",  
    },
data: selectedCoins.map(coin => ({
type: "line",
 name: coin.symbol,
showInLegend: true,
dataPoints: [{ x: new Date().getTime(), y: 0 }]  
 }))
    });
console.log("Chart created:", chart);  
chart.render();  
setInterval(updateChart, 2000);  
}
}
  
  // ---------------------- Fetch More Info ----------------------
async function getMoreInfo(coinId) {
 const url = `https://api.coingecko.com/api/v3/coins/${coinId}`;
 return await getJSON(url);
    }
    
 // ---------------------- Utility Function ----------------------
function getJSON(url) {
 return new Promise((resolve, reject) => {
 $.ajax({
url,
success: data => resolve(data),
error: err => reject(err)
 });
    });
  }
});


// --------------------- about ---------------------------

const aboutContent = `<div class="aboutDiv">

<h2 class="aboutHeader"> About </h2>

<div class="aboutSpan">

        <h3 class="h3Container"> About the project: </h3>
        
        <h5 class = "about5Container">This is a second project as part of my studies at "John Bryce" college.<br>
        This project is based on jQuery with fine detailed HTML & CSS. This jQuery project displays the most popular <br>
        and current Crypto Coins. The Crypto Coins are presented through an API. In this project each Crypto Coin is <br>
        presented along with its current data. In addition, there is an option of selecting up to five coins which are <br>
        then displayed on a graph that is automatically refreshed and updated every two seconds.
        </h5>
        
        <br>
        <br>

        <h3 class="h3Container"> About myself: </h3>
       
       <h5 class = "aboutMeContainer"> A little about myself, my name is Refael Eli Fligel, I am 26 years old and I live in Bnei Ayish in Israel. <br>
        I am a Fullstack student in "John Bryce" college. My  hobbies is Traveling, Gaming, Driving, and hit the GYM<br>
        And meeting with friends and family.</h5> <br>
        <div class="image-container">
        <h3 class="h3imgContainer">Picture of me (Hover with the mouse)</h3>
    <img src="assets/images/myPhoto.jpg" alt="Refael Eli Fligel" class="imgContainer">
</div>
    <br>

</div> 

<br>

</div>
`;

$(document).ready(function() {
    
    $("#aboutSection").append(aboutContent);
    console.log("Content appended.");
});
