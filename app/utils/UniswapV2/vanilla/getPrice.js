const { ethers } = require("ethers");
const { fetchEthPrice, getUniswapV2Price } = require("./helpers");

const args = {
  inputTokenAddress: ethers.utils.getAddress(
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
  ),
  inputTokenSymbol: "ETH",
  outputTokenAddress: ethers.utils.getAddress(
    "0x607229db773fa901215175aeb09a3a5695f813c7"
  ),
  outputTokenSymbol: "DS",
};

async function getPrice(args) {
  const {
    inputTokenSymbol,
    inputTokenAddress,
    outputTokenSymbol,
    outputTokenAddress,
    inputAmount,
  } = args;
  const price = await getUniswapV2Price(
    { symbol: inputTokenSymbol, address: inputTokenAddress },
    { symbol: outputTokenSymbol, address: outputTokenAddress }
  );
}

getPrice(args);
