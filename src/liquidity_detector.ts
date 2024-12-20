
import * as utils from './utils'
// import * as abiDecoder from "abi-decoder-ts";
import * as afx from './global'
import Web3 from 'web3';
import { ethers, BigNumber } from 'ethers';
import * as uniconst from './uniconst'
import { snipping } from './snipe';

export const startPendingTrxListener = (web3: Web3) => {

    var subscription = web3.eth.subscribe('pendingTransactions', function (error: any, result: any) {

    }).on("data", function (transactionHash: any) {
        web3.eth
            .getTransaction(transactionHash)
            .then(async function (transaction: any) {
                const parseData = parseTx(transaction.input)
                // console.log("transaction", transaction)
                // console.log("parseData", parseData)
                if (!parseData) {
                    return
                }
                const data = parseData.data
                const type = parseData.type
                if (transaction && transaction.input) {

                    if (data && type === "v2") {
                        // console.log(`===== Uniswap v2 : `,data)
                        if (data.name === "addLiquidity") {
                            const tokenA = data.args[0]
                            const tokenB = data.args[1]

                            console.log(`===== Uniswap v2 : `,data)
                            console.log(data.name)
                            console.log("tokenA", tokenA)
                            console.log("tokenB", tokenB)

                            // const amountADesired: BigNumber = data.args[2]
                            // const amountBDesired: BigNumber = data.args[3]
                            // const amountAMin: BigNumber = data.args[4]
                            // const amountBMin: BigNumber = data.args[5]
                            // const to = data.args[6]
                            // const deadline: BigNumber = data.args[7]
                            // const [amountIn, amountOutMin, path, to, deadline] = data.params.map((x: any) => x.value);
                            // filterSwapTransaction(path)
                            let targetToken = tokenA
                            if (tokenA.toLowerCase() === afx.quoteToken.address.toLowerCase()) {
                                targetToken = tokenB
                            } else if (tokenB.toLowerCase() === afx.quoteToken.address.toLowerCase()) {
                                targetToken = tokenA
                            } else {
                                return
                            }
                            const pairAddress = await utils.getPair(tokenA, tokenB)
                            // if (pairAddress !== uniconst.NULL_ADDRESS) {
                            //     return
                            // }
                            // snipping(transaction, targetToken, type)
                        }
                    } else if (data && type === "v3") {
                        const multi_func: any = decodeMulticall(data.args[0])
                        // console.log(`===== Uniswap v3 : `, data)

                        if (multi_func[0].name === "createAndInitializePoolIfNecessary" && multi_func[1].name === "mint") {
                            const tokenA = multi_func[0].args[0]
                            const tokenB = multi_func[0].args[1]

                            console.log(`===== Uniswap v3 : `, data)

                            let targetToken = tokenA
                            if (tokenA.toLowerCase() === afx.quoteToken.address.toLowerCase()) {
                                targetToken = tokenB.toLowerCase()
                            } else if (tokenB.toLowerCase() === afx.quoteToken.address.toLowerCase()) {
                                targetToken = tokenA.toLowerCase()
                            } else {
                                return
                            }
                            const pairAddress = await utils.getPool(tokenA, tokenB)

                            // if (pairAddress !== uniconst.NULL_ADDRESS) {
                            //     return
                            // }
                            // snipping(transaction, targetToken, type)
                        }
                    }
                }
            })
            .catch((error: any) => { })
    });
}

const parseTx = (data: any) => {
    // Create an interface from the ABI
    const abi_v2 = afx.get_uniswapv2_router_abi()
    const abi_v3 = afx.get_uniswapv3_router_abi()
    const iface_v2 = new ethers.utils.Interface(abi_v2);
    const iface_v3 = new ethers.utils.Interface(abi_v3);

    // Decode the transaction data
    let decodedData
    try {
        decodedData = iface_v2.parseTransaction({ data });
        return { type: 'v2', data: decodedData };
    } catch (error) {
        try {
            decodedData = iface_v3.parseTransaction({ data });
            return { type: 'v3', data: decodedData };
        } catch (error) {
            return null
        }
    }
};

const decodeMulticall = (calls: string[]) => {
    const abiInterface = new ethers.utils.Interface(afx.get_uniswapv3_nf_pos_manager_abi());
    return calls.map(call => {
        try {
            const func = call.slice(0, 10);
            const decodedArgs = abiInterface.decodeFunctionData(func, call)
            const functionName = abiInterface.getFunction(func).name
            return { name: functionName, args: decodedArgs };
        }
        catch (ex) {
            return; // you could return a type here to indicate it was not parsed
        }
    })
}

export const testModule = (web3: any) => {
    web3.eth
        .getTransaction('0xc96735a277a08aef3c46ced17f0bc578f679d90d915a95dff050372af5b2ccf6')
        .then(function (transaction: any) {
            const data: any = parseTx(transaction.input)
            if (transaction && transaction.input) {
                if (data) {
                    console.log(decodeMulticall(data.data.args[0]))
                }
            }
        })
        .catch((error: any) => { })
}





export const LOG_MINT_V2_KECCACK = '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f'
export const LOG_MINT_V3_KECCACK = '0x7a53080ba414158be7ec69b987b5fb7d07dee101fe85488f0853ae16239d0bde'

export const LOG_PAIR_CREATED_V2 = '0x0d3648bd0f6ba80134a33ba9275ac585d9d315f0ad8355cddefde31afa28d0e9'
export const LOG_PAIR_CREATED_V3 = '0x783cca1c0412dd0d695e784568c96da2e9c22ff989357a2e8b1d9b2b4e6b7118'

export const mintABI_v2 = 
{
    "anonymous": false,
    "inputs": [
        { "indexed": true, "internalType": "address", "name": "sender", "type": "address" },
        { "indexed": false, "internalType": "uint256", "name": "amount0", "type": "uint256" },
        { "indexed": false, "internalType": "uint256", "name": "amount1", "type": "uint256" }
    ],
    "name": "Mint",
    "type": "event"
}

export const mintABI_v3 = 
{
    "anonymous": false,
    "inputs": [
        { "indexed": false, "internalType": "address", "name": "sender", "type": "address" },
        { "indexed": true, "internalType": "address", "name": "owner", "type": "address" },
        { "indexed": true, "internalType": "int24", "name": "tickLower", "type": "int24" },
        { "indexed": true, "internalType": "int24", "name": "tickUpper", "type": "int24" },
        { "indexed": false, "internalType": "uint128", "name": "amount", "type": "uint128" },
        { "indexed": false, "internalType": "uint256", "name": "amount0", "type": "uint256" },
        { "indexed": false, "internalType": "uint256", "name": "amount1", "type": "uint256" }
    ],
    "name": "Mint",
    "type": "event"
}

const poolCreatedABI_v2 = {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "token0",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "token1",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "pair",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "PairCreated",
    "type": "event"
  }

 const poolCreatedABI_v3 = {

    "anonymous": false,
    "inputs": [
        {
        "indexed": true,
        "internalType": "address",
        "name": "token0",
        "type": "address"
        },
        {
        "indexed": true,
        "internalType": "address",
        "name": "token1",
        "type": "address"
        },
        {
        "indexed": true,
        "internalType": "uint24",
        "name": "fee",
        "type": "uint24"
        },
        {
        "indexed": false,
        "internalType": "int24",
        "name": "tickSpacing",
        "type": "int24"
        },
        {
        "indexed": false,
        "internalType": "address",
        "name": "pool",
        "type": "address"
        }
    ],
    "name": "PoolCreated",
    "type": "event"
}


export const startCreatePoolEventListener = async (web3: Web3) => {

    var subscription = web3.eth.subscribe('logs',  {
        topics: [[LOG_MINT_V2_KECCACK, LOG_MINT_V3_KECCACK], null]
    }, function(error, result){

    }).on("data", (log) => {

        // console.log('log', log)
        // parseLog(web3, log, callback)
        parseLog(web3, log)
    });

    console.log('Pool detector daemon has been started...')
}

const parseLog = async (web3: Web3, log: any) => {
    
    console.log("===================parseLog=====================")
    console.log("log.topics[0]", log)
    console.log("log.topics[1]", log.topics[1])
    const logCode = log.topics[0]
    const toAddress = log.topics[1]?.toLowerCase()
    if (!toAddress) {
        return
    }

    switch (logCode) {
        
        case LOG_MINT_V2_KECCACK : {

            // if (toAddress === utils.addressToHex(afx.get_uniswapv2_router_address())) {

            //     const logData = web3.eth.abi.decodeLog(mintABI_v2.inputs, log.data, log.topics.slice(1));

            //     const pairAddress = log.address

            //     const tokenResult = await getTokensByUniv2PoolAddress(web3, pairAddress)
            //     if (!tokenResult) {
            //         return
            //     }
                
            //     const {tokenA, tokenB} = tokenResult
            //     const tokenA_amount = logData.amount0
            //     const tokenB_amount = logData.amount1

            //     let poolInfo = {};
            //     if (validatePool(pairAddress, tokenA, tokenA_amount, tokenB, tokenB_amount, poolInfo) === true) {
                    
            //         poolInfo.routerAddress = afx.get_uniswapv2_router_address()
            //         poolInfo.version = 'v2'
            //         checkFirstMint(web3, poolInfo, log.transactionHash).then(async result => {

            //             if (result) {
            //                 await applyTokenSymbols(web3, poolInfo)
            //                 let str = `${poolInfo.primarySymbol}/${poolInfo.secondarySymbol}`

            //                 console.log("------------");
            //                 console.log('\x1b[32m%s\x1b[0m', `[v2] Detected first mint [${str}] Token: ${poolInfo.primaryAddress} Pair: ${poolInfo.poolAddress}`);
            //                 console.log(`${afx.get_chainscan_url()}/tx/${log.transactionHash}`);
            //                 console.log("------------");

            //                 // if (callback) {
            //                 //     callback(poolInfo, 'v2')
            //                 // }
            //             }
            //         })
            //     }
            // }
        }
        break;

        case LOG_MINT_V3_KECCACK : {
            const logData = web3.eth.abi.decodeLog(mintABI_v3.inputs, log.data, log.topics.slice(1));
            console.log("=========================logoData=========================", logData)

            // if (false && toAddress === utils.addressToHex(uniconst.uniswapV3NftPosAddress)) {

            //     const logData = web3.eth.abi.decodeLog(mintABI_v3.inputs, log.data, log.topics.slice(1));

            //     const poolAddress = log.address
                
            //     const tokenResult = await getTokensByUniv3PoolAddress(web3, poolAddress)
            //     if (!tokenResult) {
            //         return
            //     }
                
            //     const {tokenA, tokenB} = tokenResult

            //     const tokenA_amount = logData.amount0
            //     const tokenB_amount = logData.amount1
            
            //     let poolInfo = {};
            //     if (validatePool(poolAddress, tokenA, tokenA_amount, tokenB, tokenB_amount, poolInfo) === true) {

            //         poolInfo.routerAddress = uniconst.uniswapV3RouterAddress
            //         poolInfo.version = 'v3'
            //         checkFirstMint(web3, poolInfo, log.transactionHash).then(async result => {

            //             if (result) {
            //                 await applyTokenSymbols(web3, poolInfo)
            //                 let str = `${poolInfo.primarySymbol}/${poolInfo.secondarySymbol}`

            //                 console.log("------------");
            //                 console.log('\x1b[32m%s\x1b[0m', `[v3] Detected first mint [${str}] Token: ${poolInfo.primaryAddress} Pair: ${poolInfo.poolAddress}`);
            //                 console.log(`${afx.get_chainscan_url()}/tx/${log.transactionHash}`);
            //                 console.log("------------");

            //                 if (callback) {
            //                     callback(poolInfo, 'v3')
            //                 }
            //             }
            //         })
            //     }
            // }
        }
        break;
    }
}