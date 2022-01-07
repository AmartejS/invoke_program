/*eslint-disable @typescript-eslint/no-unsafe-assignment /
/ eslint-disable @typescript-eslint/no-unsafe-member-access */

import {
    Keypair,
    Connection,
    PublicKey,
    LAMPORTS_PER_SOL,
    SystemProgram,
    TransactionInstruction,
    Transaction,
    sendAndConfirmTransaction,
  } from '@solana/web3.js';
  import fs from 'mz/fs';
  import path from 'path';
  import * as borsh from 'borsh';
  
  import {getPayer, getRpcUrl, createKeypairFromFile} from './utils';
  import * as BufferLayout from '@solana/buffer-layout';
  import { Buffer } from 'buffer';
  import { INVOKED_PROGRAM_ID } from './constants'
  /**
   * Connection to the network
   */
  let connection: Connection;
  
  /**
   * Keypair associated to the fees' payer
   */
  let payer: Keypair;
  
  /**
   * Hello world's program id
   */
  let programId: PublicKey;
  
  /**
   * The public key of the account we are saying hello to
   */
  let inputaccountPubkey: PublicKey;
  
  /**
   * The public key of the account we are saying hello to
   */
   let sumaccountPubkey: PublicKey;
  /**
   * Path to program files
   */
  const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program');
  
  /**
   * Path to program shared object file which should be deployed on chain.
   * This file is created when running either:
   *   - `npm run build:program-c`
   *   - `npm run build:program-rust`
   */
  const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, 'invoke_program.so');
  
  /**
   * Path to the keypair of the deployed program.
   * This file is created when running `solana program deploy dist/program/helloworld.so`
   */
  const PROGRAM_KEYPAIR_PATH = path.join(PROGRAM_PATH, 'invoke_program-keypair.json');
  
  /**
   * The state of a greeting account managed by the hello world program
   */
  class InputAccount {
    inputA = 0;
    inputB = 0;
    
    constructor(fields: {inputA: number, inputB: number} | undefined = undefined) {
      if (fields) {
        this.inputA = fields.inputA;
        this.inputB = fields.inputB;
        
      }
    }
  }

  /**
   * Borsh schema definition for Input accounts
   */
   const InputAccountSchema = new Map([
    [InputAccount, {kind: 'struct', fields: [['inputA', 'u32'], ['inputB', 'u32'] ]}],
  ]);
  
  /**
   * The expected size of each Input account.
   */
  const INPUT_ACCOUNT_SIZE = borsh.serialize(
    InputAccountSchema,
    new InputAccount(),
  ).length;
  
  
  /**
   * The state of a Input account 
   */
   class SumAccount {
    sum = 0;
    
    constructor(fields: {sum: number} | undefined = undefined) {
      if (fields) {
        this.sum = fields.sum;
        
        
      }
    }
  }
  
  /**
   * Borsh schema definition for Sum account
   */
  const SumAccountSchema = new Map([
    [SumAccount, {kind: 'struct', fields: [['sum', 'u32'] ]}],
  ]);
  
  /**
   * The expected size of Sum account.
   */
  const SUM_ACCOUNT_SIZE = borsh.serialize(
    SumAccountSchema,
    new SumAccount(),
  ).length;
  
  
  class instructiondataset {
    input_a = 0;
    input_b = 0;
    program_id = "";
   constructor(fields: {input_a: number,input_b: number,program_id: string,} | undefined = undefined) 
   {
      if (fields) {
        this.input_a = fields.input_a;
        this.input_b = fields.input_b;
        this.program_id = fields.program_id;
       
      }
    }
  }
  
  /**
   * Borsh schema definition for instruction
   */
   const InstructionSchema = new Map([
    [instructiondataset, {kind: 'struct', fields: [['input_a', 'u32'], ['input_b', 'u32'],['program_id', 'string'] ]}],
  ]);
  
  /**
   * Establish a connection to the cluster
   */
  export async function establishConnection(): Promise<void> {
    const rpcUrl = await getRpcUrl();
    connection = new Connection(rpcUrl, 'confirmed');
    const version = await connection.getVersion();
    console.log('Connection to cluster established:', rpcUrl, version);
  }
  
  /**
   * Establish an account to pay for everything
   */
  export async function establishPayer(): Promise<void> {
    let fees = 0;
    if (!payer) {
      const {feeCalculator} = await connection.getRecentBlockhash();
  
      // Calculate the cost to fund the greeter account
      fees += await connection.getMinimumBalanceForRentExemption(INPUT_ACCOUNT_SIZE);
  
      // Calculate the cost of sending transactions
      fees += feeCalculator.lamportsPerSignature * 100; // wag
  
      payer = await getPayer();
    }
  
    let lamports = await connection.getBalance(payer.publicKey);
    if (lamports < fees) {
      // If current balance is not enough to pay for fees, request an airdrop
      const sig = await connection.requestAirdrop(
        payer.publicKey,
        fees - lamports,
      );
      await connection.confirmTransaction(sig);
      lamports = await connection.getBalance(payer.publicKey);
    }
  
    console.log(
      'Using account',
      payer.publicKey.toBase58(),
      'containing',
      lamports / LAMPORTS_PER_SOL,
      'SOL to pay for fees',
    );
  }
  
  /**
   * Check if the hello world BPF program has been deployed
   */
  export async function checkProgram(): Promise<void> {
    // Read program id from keypair file
    try {
      const programKeypair = await createKeypairFromFile(PROGRAM_KEYPAIR_PATH);
  
      programId = programKeypair.publicKey;
    } catch (err) {
      const errMsg = (err as Error).message;
      throw new Error(
        `Failed to read program keypair at '${PROGRAM_KEYPAIR_PATH}' due to error: ${errMsg}. Program may need to be deployed `,
      );
    }
    console.log('program id', programId);
  
    // Check if the program has been deployed
    const programInfo = await connection.getAccountInfo(programId);
    console.log('Program SO Path', PROGRAM_SO_PATH);
    if (programInfo === null) {
      if (fs.existsSync(PROGRAM_SO_PATH)) {
        throw new Error(
          'Program needs to be deployed with `solana program deploy dist/program/helloworld.so`',
        );
      } else {
        throw new Error('Program needs to be built and deployed');
      }
    } else if (!programInfo.executable) {
      throw new Error(`Program is not executable`);
    }
    console.log(`Using program ${programId.toBase58()}`);
  
    // Derive the address (public key) of a greeting account from the program so that it's easy to find later.
    const INPUT_ACCOUNT_SEED = 'Testing Invoke Prgram';
    const SUM_ACCOUNT_SEED = "Sum Seed"
    inputaccountPubkey = await PublicKey.createWithSeed(
      payer.publicKey,
      INPUT_ACCOUNT_SEED,
      programId,
    );
  
    sumaccountPubkey = await PublicKey.createWithSeed(
      payer.publicKey,
      SUM_ACCOUNT_SEED,
      programId,
    );
  
  console.log('second pubkey',sumaccountPubkey)
    // Check if the greeting account has already been created
    const greetedAccount = await connection.getAccountInfo(inputaccountPubkey);
    if (greetedAccount === null) {
      console.log(
        'Creating account',
        inputaccountPubkey.toBase58()

      );
      const lamports = await connection.getMinimumBalanceForRentExemption(
        INPUT_ACCOUNT_SIZE,
      );
  
      const transaction = new Transaction().add(
        SystemProgram.createAccountWithSeed({
          fromPubkey: payer.publicKey,
          basePubkey: payer.publicKey,
          seed: INPUT_ACCOUNT_SEED,
          newAccountPubkey: inputaccountPubkey,
          lamports,
          space: INPUT_ACCOUNT_SIZE,
          programId,
        }),
      );
      await sendAndConfirmTransaction(connection, transaction, [payer]);
      
    }
    // Check if the greeting account has already been created
    const secondAccount = await connection.getAccountInfo(sumaccountPubkey);
  
    if (secondAccount === null) {
      console.log(
        'Creating second account',
        inputaccountPubkey.toBase58()
      );
      const lamports = await connection.getMinimumBalanceForRentExemption(
        SUM_ACCOUNT_SIZE,
      );
  
      const transaction2 = new Transaction().add(
        SystemProgram.createAccountWithSeed({
          fromPubkey: payer.publicKey,
          basePubkey: payer.publicKey,
          seed: SUM_ACCOUNT_SEED,
          newAccountPubkey: sumaccountPubkey,
          lamports,
          space: SUM_ACCOUNT_SIZE,
          programId,
        }),
      );
      await sendAndConfirmTransaction(connection, transaction2, [payer]);
      
    }
  }
  
  function createInvokeInstructionData(): Buffer {
  
  const instructiondata= new instructiondataset();
    instructiondata.input_a = 40;
    instructiondata.input_b = 50;
    instructiondata.program_id = INVOKED_PROGRAM_ID;
    const data = Buffer.from(borsh.serialize(InstructionSchema,instructiondata));
    console.log('buffer data: ', data);
    console.log(" instructiondata.input_a", instructiondata.input_a)
    return data;
  }
  
  
  /**
   * Say hello
   */
  export async function InvokeProgram(): Promise<void> {
    
    let program_key = new PublicKey(INVOKED_PROGRAM_ID);
    //const program_account = await connection.getAccountInfo(program_key);
  
  const instruction = new TransactionInstruction({
      keys: [{pubkey: inputaccountPubkey, isSigner: false, isWritable: true},{pubkey: sumaccountPubkey, isSigner: false, isWritable: true},{pubkey: program_key, isSigner: false, isWritable: false}],
      programId,
      data: createInvokeInstructionData(),
       // All instructions are hellos
    });
    console.log("programId",programId.toBase58())
    await sendAndConfirmTransaction(
      connection,
      new Transaction().add(instruction),
      [payer],
    );
  }
  
  /**
   * Report the number of times the greeted account has been said hello to
   */
  export async function reportGreetings(): Promise<void> {
    const accountInfo = await connection.getAccountInfo(sumaccountPubkey);
    
    if (accountInfo === null) {
      throw 'Error: cannot find the greeted account';
    }
    const greeting = borsh.deserialize(
      SumAccountSchema,
      SumAccount,
      accountInfo.data,
    );
   
    console.log("accountinfo", greeting);
    console.log(
      sumaccountPubkey.toBase58(),
      //'has been greeted',
      'the sum of the two numbers is =>',
      greeting.sum,
      //'time(s)',
    );
  }