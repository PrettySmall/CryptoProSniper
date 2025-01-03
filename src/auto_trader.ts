import * as utils from './utils.js'
// import { UNISWAP_V2_ROUTER_ABI } from "./abi/uniswapv2-router-abi"
// import { UNISWAP_V3_ROUTER_ABI } from "./abi/uniswapv3-router-abi"
import * as uniconst from './uniconst'
// import { Token } from '@uniswap/sdk-core'
import { BigNumber, ethers } from "ethers";
import { ERC20_ABI } from './abi/erc20'
// import * as monitorPanel from './monitor_panel.js'
// import * as dataHistory from './data_history.js'
import * as afx from './global'
// import * as advUtils from './adv_utils.js'

import dotenv from 'dotenv'
dotenv.config()

import * as swapV2 from './swap_v2'
const INTERVAL = 1000 * 10
export const autoSwap_Buy = async (web3: any, database: any, bot: any, session: any, tokenAddress:any, buyAmount:any, buyUnit:any, version:any) => {

    // buyUnit = 'ETH', 'TOKEN'
    if (!session.pkey) {
        // await bot.sendMessageToAuthorizedUser(session, `❗ AutoBuy failed: No wallet attached.`, null)
        console.log(`❗ AutoBuy failed: No wallet attached.`)
        return false
    }

    await swapV2.buyToken(web3, database, session, tokenAddress, buyAmount, buyUnit, version, async (msg:any) => {

        console.log(msg)
        // await bot.sendMessageToAuthorizedUser(session, msg, null)

    }, async (params:any) => {

        console.log(params)
        if (params.status !== 'success') {
            return
        }

        // const tokenInfo = await utils.getTokenInfo(tokenAddress)
        // const txHash = params.txHash
        // const tokenPrice = await utils.getTokenPrice(web3, tokenAddress)
        // const tokenName = tokenInfo.name
        // const tokenSupply = tokenInfo.totalSupply
        // const buyAmount = params.ethAmount
        // const boughtTokenAmount = params.tokenAmount

        //console.log(txHash, tokenName, tokenAddress, tokenPrice, tokenSupply, buyAmount, boughtTokenAmount);

        // monitorPanel.investigate(web3, txHash, tokenName, tokenAddress, tokenPrice, tokenSupply, buyAmount, boughtTokenAmount, async (msg) => {

        //     const poolJson = {
        //         primaryAddress: tokenAddress,
        //         poolAddress: '',
        //         version: version
        //     }

        //     const poolId = await database.addPoolHistory(poolJson)

        //     const json = {
        //         chat_id: session.chatid,
        //         token_address: tokenAddress,
        //         token_name: tokenName,
        //         token_price: tokenPrice,
        //         token_supply: tokenSupply,
        //         eth_amount: buyAmount,
        //         token_amount: boughtTokenAmount,
        //         token_symbol: tokenInfo.symbol,
        //         token_decimal: tokenInfo.decimal,
        //         tx_hash: txHash,
        //         version: version
        //     }

        //     const panelId = await database.addPanelHistory(json)
        //     const itemId = await database.addTokenPanelHistory(json)

        //     // await dataHistory.storePanelData(session.chatid, panelId, panelId, json.token_name, msg)

        //     // await bot.trackPanel(session.chatid, panelId, 0)
        //     await bot.tokenTrackPanel(session.chatid, itemId, 0, msg, json.token_name)

        //     // if (tokenPrice > 0) {
        //     //     await database.addAutoSellToken(session.chatid, tokenAddress, tokenInfo.name, tokenInfo.symbol, tokenInfo.decimal, tokenPrice)
        //     // }
        // })

    })
}

// export const autoSwap_Sell = async (web3, database, bot, session, tokenAddress, sellPercent, sellAmount, sellUnit, version, callback = null) => {

//     const sellValue = (sellUnit === 'PERCENT' ? sellPercent : sellAmount)
//     await swapV2.sellToken(web3, database, session, tokenAddress, sellValue, sellUnit, version, (msg) => {
//         bot.sendMessage(session.chatid, msg)
//         console.log(`[${session.chatid}]`, msg)
//     }, async (params) => {
//         if (callback) {
//             callback(params)
//         }
//     })
// }
// export const removeAutoSellAllData = async (database, sessionId) => {
//     const result = await database.removeAutoSellTokensByUser(sessionId)
//     await database.removePanelHistoryByChatId(sessionId)
//     return result;
// }
// export const removeAutoSellAllDataByTokenId = async (database, token_id) => {
//     await database.removeAutoSellToken(token_id)
// }
// export const removeAutoSellAllDataByParam = async (database, param) => {
//     await database.removeAutoSellTokenByParam(param)
// }

// export const removeLimitOrderAllDataByParam = async (database, param) => {
//     await database.removeLimitOrderTokenByParam(param)
// }
// export const removeLimitOrderAllDataByTokenId = async (database, token_id) => {
//     await database.removeLimitOrderToken(token_id)
// }

// export const autoSwap_Sell_thread = async (web3, database, bot) => {

//     const autoTradeTokens = await database.selectAutoSellTokens({})

//     for (const token of autoTradeTokens) {
//         try {
//             const predictPrice = await utils.getTokenPrice(web3, token.address)

//             if (predictPrice === 0) {
//                 continue
//             }

//             const session = bot.sessions.get(token.chatid)

//             if (!session || (!session.trade_autosell && !session.snipe_use_autosell) || !session.pkey || !token.price) {
//                 continue
//             }
//             const privateKey = utils.decryptPKey(session.pkey)

//             if (!privateKey) {
//                 await removeAutoSellAllDataByTokenId(database, token._id)
//                 continue;
//             }

//             let wallet = null
//             try {
//                 wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
//             } catch (error) {
//                 continue;
//             }

//             if (!web3.utils.isAddress(wallet.address)) {
//                 continue;
//             }

//             let tokenContract = null;
//             let tokenDecimals = null
//             let tokenSymbol = null

//             try {
//                 tokenContract = new web3.eth.Contract(afx.get_ERC20_abi(), token.address)
//                 tokenDecimals = await tokenContract.methods.decimals().call()
//                 tokenSymbol = await tokenContract.methods.symbol().call()

//             } catch (error) {
//                 continue;
//             }

//             let rawTokenBalance = web3.utils.toBN(await tokenContract.methods.balanceOf(wallet.address).call());
//             if (rawTokenBalance.isZero()) {
//                 await removeAutoSellAllDataByTokenId(database, token._id);
//                 continue;
//             }

//             const tokenTax = await advUtils.getTokenTax(web3, [afx.get_weth_address(), token.address.toLowerCase()])

//             const profitPercent = predictPrice * (100 - tokenTax.sellTax) / token.price - 100.0
//             // const profitPercent = predictPrice * 100.0 / token.price * (100 - tokenTax.sellTax) / 100 - 100.0

//             //console.log(`[${session.chatid}] ${utils.roundDecimal(profitPercent, 1)}% profit/loss ${predictPrice} ${token.address} ${token.name}`)
//             if (profitPercent >= session.trade_autosell_hi) {

//                 bot.sendMessage(session.chatid, `Sell-Hi (${utils.roundDecimal(profitPercent, 1)}% profit) detected...
//             Token to Sell: ${token.name} (${token.symbol})
//             Original Price: ${utils.roundEthUnit(token.price)}
//             Current Price: ${utils.roundEthUnit(predictPrice)}
//             Sell Amount: ${session.trade_autosell_hi_amount} %`)

//                 await autoSwap_Sell(web3, database, bot, session, token.address, session.trade_autosell_hi_amount, 0, 'PERCENT', 'v2', async (result) => {
//                     let rawTokenBalance = web3.utils.toBN(await tokenContract.methods.balanceOf(wallet.address).call());
//                     if (rawTokenBalance.isZero()) {
//                         await removeAutoSellAllDataByTokenId(database, token._id);
//                     }
//                 })

//             } else {

//                 if (profitPercent <= session.trade_autosell_lo) {

//                     // session.trade_autosell_lo is always minus value
//                     bot.sendMessage(session.chatid, `Sell-Lo (${utils.roundDecimal(profitPercent, 1)}% loss) detected...
//             Token to Sell: ${token.name} (${token.symbol})
//             Original Price: ${utils.roundEthUnit(token.price)}
//             Current Price: ${utils.roundEthUnit(predictPrice)}
//             Sell Amount: ${session.trade_autosell_lo_amount} %`)

//                     await autoSwap_Sell(web3, database, bot, session, token.address, session.trade_autosell_lo_amount, 0, 'PERCENT', 'v2', async (result) => {

//                         let rawTokenBalance = web3.utils.toBN(await tokenContract.methods.balanceOf(wallet.address).call());
//                         if (rawTokenBalance.isZero()) {
//                             await removeAutoSellAllDataByTokenId(database, token._id);
//                         }
//                     })
//                 }
//             }
//             await utils.sleep(20);
//         } catch (error) {

//             console.log('AutoTrader failure', error, afx.parseError(error))
//         }
//     }

//     setTimeout(() => {
//         autoSwap_Sell_thread(web3, database, bot)
//     }
//         , INTERVAL)
// }

// export const autoSellLimitOrder_thread = async (web3, database, bot) => {
//     const autoLimitOrderTokens = await database.selectLimitOrderTokens({})

//     for (const token of autoLimitOrderTokens) {
//         try {
//             const predictPrice = await utils.getTokenPrice(web3, token.address)

//             if (predictPrice === 0) {
//                 continue
//             }

//             const session = bot.sessions.get(token.chatid)

//             if (!session || !session.pkey || !token.price) {
//                 continue
//             }
//             const privateKey = utils.decryptPKey(session.pkey)

//             // if (!privateKey) {
//             //     await removeAutoSellAllDataByTokenId(database, token._id)
//             //     continue;
//             // }

//             let wallet = null
//             try {
//                 wallet = web3.eth.accounts.privateKeyToAccount(privateKey);
//             } catch (error) {
//                 continue;
//             }

//             if (!web3.utils.isAddress(wallet.address)) {
//                 continue;
//             }

//             let tokenContract = null;
//             let tokenDecimals = null
//             let tokenSymbol = null

//             try {
//                 tokenContract = new web3.eth.Contract(afx.get_ERC20_abi(), token.address)
//                 tokenDecimals = await tokenContract.methods.decimals().call()
//                 tokenSymbol = await tokenContract.methods.symbol().call()

//             } catch (error) {
//                 continue;
//             }

//             let rawTokenBalance = web3.utils.toBN(await tokenContract.methods.balanceOf(wallet.address).call());
//             if (rawTokenBalance.isZero()) {
//                 await removeAutoSellAllDataByTokenId(database, token._id);
//                 continue;
//             }

//             const tokenTax = await advUtils.getTokenTax(web3, [afx.get_weth_address(), token.address.toLowerCase()])

//             const profitPercent = predictPrice * (100 - tokenTax.sellTax) / token.price - 100.0
//             // const profitPercent = predictPrice * 100.0 / token.price * (100 - tokenTax.sellTax) / 100 - 100.0

//             //console.log(`[${session.chatid}] ${utils.roundDecimal(profitPercent, 1)}% profit/loss ${predictPrice} ${token.address} ${token.name}`)
//             if (profitPercent >= token.sell_hi) {

//                 bot.sendMessage(session.chatid, `Sell-Hi (${utils.roundDecimal(profitPercent, 1)}% profit) detected...
//             Token to Sell: ${token.name} (${token.symbol})
//             Original Price: ${utils.roundEthUnit(token.price)}
//             Current Price: ${utils.roundEthUnit(predictPrice)}
//             Sell Amount: ${token.sell_hi_amount} %`)

//                 await autoSwap_Sell(web3, database, bot, session, token.address, token.sell_hi_amount, 0, 'PERCENT', 'v2', async (result) => {
//                     let rawTokenBalance = web3.utils.toBN(await tokenContract.methods.balanceOf(wallet.address).call());
//                     if (rawTokenBalance.isZero()) {
//                         await removeAutoSellAllDataByTokenId(database, token._id);
//                     }
//                 })

//             } else {

//                 if (profitPercent <= token.sell_lo) {

//                     // session.trade_autosell_lo is always minus value
//                     bot.sendMessage(session.chatid, `Sell-Lo (${utils.roundDecimal(profitPercent, 1)}% loss) detected...
//             Token to Sell: ${token.name} (${token.symbol})
//             Original Price: ${utils.roundEthUnit(token.price)}
//             Current Price: ${utils.roundEthUnit(predictPrice)}
//             Sell Amount: ${token.sell_lo_amount} %`)

//                     await autoSwap_Sell(web3, database, bot, session, token.address, token.sell_lo_amount, 0, 'PERCENT', 'v2', async (result) => {

//                         let rawTokenBalance = web3.utils.toBN(await tokenContract.methods.balanceOf(wallet.address).call());
//                         if (rawTokenBalance.isZero()) {
//                             await removeLimitOrderAllDataByTokenId(database, token._id);
//                         }
//                     })
//                 }
//             }
//             await utils.sleep(20);
//         } catch (error) {

//             console.log('AutoTrader failure', error, afx.parseError(error))
//         }
//     }

//     setTimeout(() => {
//         autoSellLimitOrder_thread(web3, database, bot)
//     }
//         , INTERVAL)
// }

// export const start = async (web3, database, bot) => {

//     console.log('AutoTrader daemon has been started...')

//     setTimeout(() => {
//         autoSwap_Sell_thread(web3, database, bot)
//     }, INTERVAL)

//     setTimeout(() => {
//         autoSellLimitOrder_thread(web3, database, bot)
//     }, INTERVAL)
// }