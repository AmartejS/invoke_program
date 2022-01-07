
  
use borsh::{BorshDeserialize, BorshSerialize};
use std::str::FromStr;
use solana_program::{
    account_info::{next_account_info, AccountInfo},
    instruction::{AccountMeta, Instruction},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey, pubkey::Pubkey, 
    program::invoke
};


mod instruction;

use instruction::initialize_sum_account;



use core::convert::From;






#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct instructiondata {
   
    pub input_a: u32,
    pub input_b: u32,
    pub program_id: String,
}

// Declare and export the program's entrypoint
entrypoint!(process_instruction);

// Program entrypoint's implementation
pub fn process_instruction(
    program_id: &Pubkey, // Public key of the account the hello world program was loaded into
    accounts: &[AccountInfo], // The account to say hello to
    _instruction_data: &[u8],
     // Ignored, all helloworld instructions are hellos
) -> ProgramResult {
    msg!("Entering Invoke program entrypoint");
     // Increment and store the number of times the account has been greeted
   let mut greeting_account = instructiondata::try_from_slice(_instruction_data).unwrap();
   msg!("{:?}",greeting_account);
//     let keyReceived = String::from_utf8_lossy(_instruction_data);
//    let instruction = HelloInstruction::unpack(_instruction_data);

let my_id = Pubkey::from_str(&greeting_account.program_id).unwrap();
msg!("program_id => {:?}",my_id);


   //Iterating accounts is safer then indexing
     let accounts_iter = &mut accounts.iter();
    
   
     let account1 = next_account_info(accounts_iter)?;

    
    msg!("account {:?}",account1.data );


    let acc1 = account1.key;
    let account2 = next_account_info(accounts_iter)?;

    let acc2 = account2.key; 
    let mut data: Vec<u8> = Vec::with_capacity(10);
   
    let programaccount = next_account_info(accounts_iter)?;
    
    

    


 invoke( &initialize_sum_account(
    &my_id,
    acc1,
    acc2,
   
)?, &[account1.clone(), account2.clone(), programaccount.clone()]);
      
 

    Ok(())
  }
