const axios = require("axios");

const GRAPH_ENDPOINT =
  "https://api.thegraph.com/subgraphs/name/ianlapham/uniswap-v2-dev";

const ETHUSDPool = "0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852";
const poolAddress = "0x9eb51eb22813ee077e7ef4739a68d8e0b8e67cc6";

const MAX_RETRIES = 2;
const RETRY_DELAY = 2000; // milliseconds

const fetchCurrentPrice = async (retries = 0) => {
  const query = `
    {
      uniPair: pair(id: "${poolAddress}") {
        token0Price
        token1Price
        token0 {
          id
        }
        token1 {
          id
        }
      }
      ethUsdtPair: pair(id: "${ETHUSDPool}") {
        token0Price
        token1Price
        token0 {
          id
          symbol
        }
        token1 {
          id
          symbol
        }
      }
    }
  `;

  try {
    const response = await axios.post(GRAPH_ENDPOINT, { query });
    const data = response.data.data;

    let ethPriceInUsdt;
    if (
      data.ethUsdtPair.token0.symbol === "ETH" ||
      data.ethUsdtPair.token0.symbol === "WETH"
    ) {
      ethPriceInUsdt = data.ethUsdtPair.token1Price;
    } else {
      ethPriceInUsdt = data.ethUsdtPair.token0Price;
    }

    const uniToken0Price = data.uniPair.token0Price;

    return {
      ethPriceInUSDT: ethPriceInUsdt,
      uniToken0Price: uniToken0Price,
      uniToken1PriceInUSDT: (1 / uniToken0Price) * ethPriceInUsdt,
    };
  } catch (error) {
    console.error("Error fetching data:", error);

    if (retries < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      return fetchCurrentPrice(retries + 1);
    } else {
      console.error("Max retries reached. Returning null.");
      return null;
    }
  }
};

fetchCurrentPrice().then((data) => console.log(data));

module.exports = fetchCurrentPrice;
