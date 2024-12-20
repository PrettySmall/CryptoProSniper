
import * as bot from "./bot"
import { OptionCode } from "./bot"
import * as utils from './utils'
import * as database from './db'
import * as afx from './global'
import { DelayDetector } from "./delay_detector"
import * as swapManager from './swap_manager'

import dotenv from 'dotenv'
import Web3 from 'web3'
import { ethers } from "ethers";
import * as poolDetector from "./liquidity_detector"
dotenv.config()


export const web3 = new Web3(new Web3.providers.WebsocketProvider(afx.get_ethereum_rpc_socket_url()))
// export const web3Http = new Web3(afx.get_ethereum_rpc_http_url());
export const ethersHttp = new ethers.providers.JsonRpcProvider(afx.get_ethereum_rpc_http_url())
afx.setWeb3(web3)
afx.setETHs(ethersHttp)
afx.init()

bot.init(async (session: any, command: string, params: any, messageId: number) => {



}, async (option: number, param: any) => {

    if (option === OptionCode.MSG_GETTOKENINFO) {
        const session = param.session
        const address = param.address

        const menu: any = await bot.json_msg(session.chatid, address)
        if (menu) {
            await bot.sendOptionMessage(session.chatid, menu.title, menu.options)
        }
    }
})

poolDetector.startPendingTrxListener(web3)
// poolDetector.startCreatePoolEventListener(web3)


// poolDetector.testModule(web3)
// import {aesCreateKey} from './aes'

// console.log(aesCreateKey())

//  const pkey='UBtRfkSFonncumBAV0upwSxVuTGDDWmpggsRA48Pct2rJwBOH03wlA0s1IPRhfOEWatx9c+JtlEkXzh9nngXj/e0mFdxvXHB/mrHu6kEN3g='
//  console.log(utils.decryptPKey(pkey))