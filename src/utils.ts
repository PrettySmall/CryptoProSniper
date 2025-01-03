import EventEmitter from 'events'
import axios from 'axios'

import * as fs from 'fs'

import assert from 'assert';
import * as afx from './global'

import * as crypto from './aes'
import { Concurrencer } from './concurrencer'
import { DelayDetector } from "./delay_detector"
import * as ethUtil from 'ethereumjs-util'
import * as uniconst from './uniconst'
import { ethers } from "ethers";

import dotenv from 'dotenv'
dotenv.config()

import bs58 from "bs58";
import * as bip39 from "bip39";

export const isValidAddress = (address: string) => {
    // Check if it's 20 bytes
    if (address.length !== 42) {
        return false;
    }

    // Check that it starts with 0x
    if (address.slice(0, 2) !== '0x') {
        return false;
    }

    // Check that each character is a valid hexadecimal digit
    for (let i = 2; i < address.length; i++) {
        let charCode = address.charCodeAt(i);
        if (!((charCode >= 48 && charCode <= 57) ||
            (charCode >= 65 && charCode <= 70) ||
            (charCode >= 97 && charCode <= 102))) {
            return false;
        }
    }

    // If all checks pass, it's a valid address
    return true;
}

export function isValidPrivateKey(privateKey: string) {
    try {

        if (privateKey.startsWith('0x')) {
            privateKey = privateKey.substring(2)
        }
        const privateKeyBuffer = Buffer.from(privateKey, 'hex');
        const publicKeyBuffer = ethUtil.privateToPublic(privateKeyBuffer);
        const addressBuffer = ethUtil.pubToAddress(publicKeyBuffer);
        const address = ethUtil.bufferToHex(addressBuffer);
        return true
    } catch (error) {
        return false
    }
}

export async function getBalance(wallet: string) {

    assert(afx.web3Conn)

    return await getWalletTokenBalance(wallet, '')
}

export const getWalletAddressFromPKey = (privateKey: string): string => {

    assert(afx.web3Conn)

    const account = afx.web3Conn.eth.accounts.privateKeyToAccount(privateKey);
    const walletAddress = account.address;

    return walletAddress
}

export const roundDecimal = (number: number, digits: number = 5) => {
    return number.toLocaleString('en-US', { maximumFractionDigits: digits });
}

export const roundDecimalWithUnit = (number: number, digits: number = 5, unit: string = '') => {
    if (!number) {
      return afx.NOT_ASSIGNED
    }
    return number.toLocaleString('en-US', {maximumFractionDigits: digits}) + unit;
}

export const sRoundDecimal = (number: number, digits: number) => {

    let result = roundDecimal(number, digits)
    return number > 0 ? `+${result}` : result
}

export const sRoundDecimalWithUnitAndNull = (number: number | null, digits: number, unit: string) => {

    if (!number) {
        return 'None'
    }

    if (number === 0) {
        return `0${unit}`
    }

    let result = roundDecimal(number, digits)
    return number > 0 ? `+${result}${unit}` : `${result}${unit}`
}

export const roundEthUnit = (number: number, digits: number = 5) => {

    if (Math.abs(number) >= 0.00001) {
        return `${roundDecimal(number, digits)} ETH`
    }

    number *= 1000000000

    if (Math.abs(number) >= 0.00001) {
        return `${roundDecimal(number, digits)} GWEI`
    }

    number *= 1000000000
    return `${roundDecimal(number, digits)} WEI`
}

export const roundBigUnit = (number: number, digits: number = 5) => {

    let unitNum = 0
    const unitName = ['', 'K', 'M', 'B']
    while (number >= 1000) {

        unitNum++
        number /= 1000

        if (unitNum > 2) {
            break
        }
    }

    return `${roundDecimal(number, digits)} ${unitName[unitNum]}`
}

export const shortenAddress = (address: string, length: number = 6) => {
    if (address.length < 2 + 2 * length) {
        return address; // Not long enough to shorten
    }

    const start = address.substring(0, length + 2);
    const end = address.substring(address.length - length);

    return start + "..." + end;
}

export const shortenString = (str: string, length: number = 8) => {

    if (length < 3) {
        length = 3
    }

    if (!str) {
        return "undefined"
    }

    if (str.length < length) {
        return str; // Not long enough to shorten
    }

    const temp = str.substring(0, length - 3) + '...';

    return temp;
}

export const limitString = (str: string, length: number = 8) => {

    if (length < 3) {
        length = 3
    }

    if (!str) {
        return "undefined"
    }

    if (str.length < length) {
        return str; // Not long enough to shorten
    }

    const temp = str.substring(0, length);

    return temp;
}

export const getTimeStringUTC = (timestamp: Date) => {

    const options: any = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZone: 'UTC'
    };

    const formattedDate = timestamp.toLocaleString('en-US', options);

    return formattedDate
}

export const getTimeStringUTCFromNumber = (timestamp: number) => {

    try {
        return getTimeStringUTC(new Date(timestamp))
    } catch (error) {

    }

    return 'None'
}

export const fetchAPI = async (url: string, method: 'GET' | 'POST', data: Record<string, any> = {}): Promise<any | null> => {
    return new Promise(resolve => {
        if (method === "POST") {
            axios.post(url, data).then(response => {
                let json = response.data;
                resolve(json);
            }).catch(error => {
                // console.error('[fetchAPI]', error)
                resolve(null);
            });
        } else {
            axios.get(url).then(response => {
                let json = response.data;
                resolve(json);
            }).catch(error => {
                // console.error('fetchAPI', error);
                resolve(null);
            });
        }
    });
};

export const fetchAPIBy = async (url: string, method: 'GET' | 'POST', data: Record<string, any> = {}): Promise<any | null> => {
    return new Promise(resolve => {
        if (method === "POST") {
            axios.post(url, data).then(response => {
                let json = response.data;
                resolve(json);
            }).catch(error => {
                resolve(null);
            });
        } else {
            console.log(url);
            axios.get(url).then(response => {
                let json = response.data;
                resolve(json);
            }).catch(error => {
                console.error('fetchAPI', error);
                resolve(null);
            });
        }
    });
};


export const addressToHex = (address: string) => {
    const hexString = '0x' + address.slice(2).toLowerCase().padStart(64, '0');
    return hexString.toLowerCase();
}

export const createDirectoryIfNotExists = (directoryPath: string) => {
    if (!fs.existsSync(directoryPath)) {
        fs.mkdirSync(directoryPath);
        console.log(`The directory '${directoryPath}' has been created.`);
    } else {
    }
};

export const getShortenedAddress = (address: string) => {

    if (!address) {
        return ''
    }

    let str = address.slice(0, 24) + '...'

    return str
}

export const encryptPKey = (text: string) => {

    if (text.startsWith('0x')) {
        text = text.substring(2)
    }

    return crypto.aesEncrypt(text, process.env.CRYPT_KEY ?? '')
}

export const decryptPKey = (text: string) => {
    return crypto.aesDecrypt(text, process.env.CRYPT_KEY ?? '')
}

export const generateNewWallet = () => {

    try {
        const mnemonic = ethers.Wallet.createRandom().mnemonic;

        const wallet = ethers.Wallet.fromMnemonic(mnemonic.phrase.toString());

        const privateKey = wallet.privateKey;
        const address = wallet.address;

        return { mnemonic: mnemonic.phrase, privateKey, address }

    } catch (error) {

        console.log(error)
        return null
    }
}

export function isValidSeedPhrase(seedPhrase: string) {
    // Check if the seed phrase is valid
    const isValid = bip39.validateMnemonic(seedPhrase);

    return isValid;
}

export async function seedPhraseToPrivateKey(seedPhrase: string): Promise<string | null> {
    try {
        const wallet = ethers.Wallet.fromMnemonic(seedPhrase);
        const privateKey = wallet.privateKey;
        return privateKey;

    } catch (error) {
        return null
    }
}

export function waitForEvent(eventEmitter: EventEmitter, eventName: string): Promise<void> {
    return new Promise<void>(resolve => {
        eventEmitter.on(eventName, resolve);
    });
}

export async function waitSeconds(seconds: number) {
    const eventEmitter = new EventEmitter()

    setTimeout(() => {
        eventEmitter.emit('TimeEvent')
    }, seconds * 1000)

    await waitForEvent(eventEmitter, 'TimeEvent')
}

export async function waitMilliseconds(ms: number) {
    const eventEmitter = new EventEmitter()

    setTimeout(() => {
        eventEmitter.emit('TimeEvent')
    }, ms)

    await waitForEvent(eventEmitter, 'TimeEvent')
}

export const getFullTimeElapsedFromSeconds = (totalSecs: number) => {

    if (totalSecs < 0) {
        totalSecs = 0
    }

    let sec = 0, min = 0, hour = 0, day = 0

    sec = totalSecs
    if (sec > 60) {
        min = Math.floor(sec / 60)
        sec = sec % 60
    }

    if (min > 60) {
        hour = Math.floor(min / 60)
        min = min % 60
    }

    if (hour > 24) {
        day = Math.floor(hour / 24)
        hour = hour % 60
    }

    let timeElapsed = ''

    if (day > 0) {
        timeElapsed += `${day}d`
    }

    if (hour > 0) {
        if (timeElapsed !== '') {
            timeElapsed += ' '
        }

        timeElapsed += `${hour}h`
    }

    if (min > 0) {
        if (timeElapsed !== '') {
            timeElapsed += ' '
        }

        timeElapsed += `${min}m`
    }

    if (sec > 0) {
        if (timeElapsed !== '') {
            timeElapsed += ' '
        }

        timeElapsed += `${sec}s`
    }

    return timeElapsed
}

export const getFullMinSecElapsedFromSeconds = (totalSecs: number) => {

    let sec = 0, min = 0, hour = 0, day = 0

    sec = totalSecs
    if (sec > 60) {
        min = Math.floor(sec / 60)
        sec = sec % 60
    }

    let timeElapsed = `${min}:${sec}`

    return timeElapsed
}

export const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export const getDateTimeFromTimestamp = (timestmp: number) => {

    const value = new Date(timestmp)
    let month = (value.getMonth() + 1).toString()
    let day = value.getDate().toString()
    let year = value.getFullYear().toString()

    return `${month}/${day}/${year}`
}

export const getConfigString_Default = (value: string, defaultValue: string, unit: string = '', prefix: string = '', digit: number = 9) => {

    let output

    const value2 = (typeof value === 'number' ? roundDecimal(value, digit) : value)

    let temp
    if (unit === 'USD') {
        temp = `$${value2}`
    } else if (unit === '%') {
        temp = `${value2}%`
    } else {
        temp = `${value2}${unit.length > 0 ? ' ' + unit : ''}`
    }

    if (value === defaultValue) {
        output = `Default (${prefix}${temp})`
    } else {
        output = `${prefix}${temp}`
    }

    return output
}

export const getConfigString_Text = (text: string, value: number, autoValue: number, unit: string = '', digit: number = 9) => {

    let output

    if (value === autoValue) {
        output = text
    } else {

        const value2 = (typeof value === 'number' ? roundDecimal(value, digit) : value)
        if (unit === 'USD') {
            output = `$${value2}`
        } else if (unit === '%') {
            output = `${value2}%`
        } else {
            output = `${value2}${unit.length > 0 ? ' ' + unit : ''}`
        }
    }

    return output
}

export const getConfigString_Checked = (value: number) => {

    let output

    if (value === 2) {
        output = '🌐'
    } else if (value === 1) {
        output = '✅'
    } else {
        output = '❌'
    }

    return output
}

export const getConfigWallet_Checked = (value: number) => {

    let output

    if (value === 1) {
        output = '✅'
    } else {
        output = ''
    }

    return output
}

export function objectDeepCopy(obj: any, keysToExclude: string[] = []): any {
    if (typeof obj !== 'object' || obj === null) {
        return obj; // Return non-objects as is
    }

    const copiedObject: Record<string, any> = {};
    for (const key in obj) {
        if (obj.hasOwnProperty(key) && !keysToExclude.includes(key)) {
            copiedObject[key] = obj[key];
        }
    }

    return copiedObject;
}


export const nullWalk = (val: any) => {
    if (!val) {
        return afx.NOT_ASSIGNED
    }

    return val
}

export const getWalletTokenBalance = async(wallet: string, tokenAddress: string): Promise<number> => {

    assert(afx.ethersConn)

    if (tokenAddress === '') {
        return Number(await afx.web3Conn.eth.getBalance(wallet)) / (10 ** uniconst.WETH_DECIMALS);
    }

    let tokenContract: any = null;
    try {
        tokenContract = new ethers.Contract(tokenAddress, afx.get_ERC20_abi(), afx.ethersConn);
    } catch (error) {
        afx.errorLog('getWalletTokenBalance', error)
        return -1
    }

    if (!tokenContract) {
        return -1;
    }

    try {
        const balance = await tokenContract.balanceOf(wallet);
        const decimals = await tokenContract.decimals();
        const tokenBalance = Number(balance) / 10 ** Number(decimals);

        return tokenBalance;

    } catch (error) {
        afx.errorLog('getWalletTokenBalance 2', error)
    }

    return -1;
}

export const getWalletETHBalance = async(wallet: string): Promise<number> => {

    assert(afx.ethersConn)

    try {
        const ethValue = Number(await afx.ethersConn.getBalance(wallet)) / (10 ** uniconst.WETH_DECIMALS)
        return ethValue
    } catch (error) {
        console.log(error)
    }
     
    return 0
}

export const getCurrentTimeTick = (ms: boolean = false) => {

    if (ms) {
        return new Date().getTime()
    }

    return Math.floor(new Date().getTime() / 1000)
}


export const getTokenInfo = async (tokenAddress: string) : Promise<any | null> => {

    assert(afx.ethersConn)

    return new Promise(async (resolve, reject) => {

        let tokenContract: any

        try {
            tokenContract = new ethers.Contract(tokenAddress, afx.get_ERC20_abi(), afx.ethersConn);

            var tokenPromises: any[] = [];

            tokenPromises.push(tokenContract.name());
            tokenPromises.push(tokenContract.symbol());
            tokenPromises.push(tokenContract.decimals());
            tokenPromises.push(tokenContract.totalSupply());

            Promise.all(tokenPromises).then(tokenInfo => {

                const decimals = parseInt(tokenInfo[2])
                const totalSupply = Number(tokenInfo[3]) / 10 ** decimals
                const result = { address: tokenAddress, name: tokenInfo[0], symbol: tokenInfo[1], decimals, totalSupply }

                resolve(result)

            }).catch(err => {

                // console.log(err)
                resolve(null)
            })

        } catch (err) {

            // console.error(err)
            resolve(null)
            return
        }
    })
}

export const getPair = async (token0: string, token1: string) : Promise<string> => {

    assert(afx.ethersConn)

    let result = uniconst.NULL_ADDRESS
    try {
        const factoryContract = new ethers.Contract(uniconst.UniswapV2FactoryContractAddress, afx.get_uniswapv2_factory_abi(), afx.ethersConn);
        if (factoryContract) {
            result = await factoryContract.getPair(token0, token1)
        }

    } catch (error) {
        console.error("find pair error", token0, token1);
    }

    return result
}

export const getPool = async (token0: string, token1: string) : Promise<string> => {

    assert(afx.ethersConn)

    let result = uniconst.NULL_ADDRESS
    try {
        const factoryContract = new ethers.Contract(uniconst.UniswapV3FactoryContractAddress, afx.get_uniswapv2_factory_abi(), afx.ethersConn);
        if (factoryContract) {
            result = await factoryContract.getPool(token0, token1, 500)
        }

    } catch (error) {
        // console.error(error)
    }

    return result
}

export async function getGasPrices(web3: any): Promise<any> {
    try {
        const gasPrice = await web3.eth.getGasPrice();
        console.log("==============gasPrice================", gasPrice);
        const gasPrices = {
            low: web3.utils.toBN(gasPrice),
            medium: web3.utils.toBN(gasPrice).muln(1.2),
            high: web3.utils.toBN(gasPrice).muln(1.5),
        };

        return gasPrices;
    } catch (error) {
        console.log("error:", error);
    }
}

export const toBNe18 = (web3: any, value: number): any => {
    return web3.utils.toBN(web3.utils.toWei(value.toFixed(18).toString(), 'ether'));
};

export const toBNeN = (web3: any, value: number, decimals: number = 18): any => {
    if (18 < decimals || decimals < 1) {
        throw `Decimal must be between 1 to 18`;
    }

    return web3.utils.toBN(web3.utils.toWei(value.toFixed(18).toString())).div(web3.utils.toBN(10 ** (18 - decimals)));
};

export const getFullTxLink = (chainId: any, hash:any) => {

    let prefixHttps = ''
    if (chainId === uniconst.ETHEREUM_GOERLI_CHAIN_ID) {

        prefixHttps = 'https://goerli.etherscan.io/tx/'

    } else if (chainId === uniconst.ETHEREUM_GOERLI_CHAIN_ID) {

        prefixHttps = 'https://etherscan.io/tx/'

    } else if (chainId === uniconst.ETHEREUM_SEPOLIA_CHAIN_ID) {

        prefixHttps = 'https://sepolia.etherscan.io/tx/'
    } else if (chainId === uniconst.BSC_CHAIN_ID) {

        prefixHttps = 'https://bscscan.com/tx/'
    }

    let txLink = `${prefixHttps}${hash}`

    return txLink
}